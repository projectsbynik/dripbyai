/*
  # Fix ambiguous gender column reference in search_products function

  1. Changes
    - Properly qualify the gender column reference with table name
    - Rename gender parameter to profile_gender to avoid confusion
    - Update the gender comparison logic
    - Maintain existing functionality and security

  2. Security
    - Maintains existing RLS policies
    - Preserves admin access controls
*/

-- Drop existing search function
DROP FUNCTION IF EXISTS public.search_products;

-- Create fixed version of search function
CREATE OR REPLACE FUNCTION public.search_products(
  search_query text,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  occasions text[] DEFAULT NULL,
  profile_gender text DEFAULT NULL,
  skin_tones text[] DEFAULT NULL,
  undertones text[] DEFAULT NULL,
  body_shapes text[] DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  sort_order text DEFAULT 'desc',
  limit_val integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  source_url text,
  occasion text[],
  popularity integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  relevance float,
  search_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      p.*,
      ts_rank(
        to_tsvector('english',
          coalesce(p.name, '') || ' ' ||
          coalesce(p.description, '') || ' ' ||
          array_to_string(p.keywords, ' ')
        ),
        to_tsquery('english', regexp_replace(search_query, '\s+', ':* & ', 'g') || ':*')
      ) as relevance,
      (
        CASE
          -- Highest score: Match in both name and keywords
          WHEN p.name ILIKE '%' || search_query || '%' 
            AND p.keywords @> ARRAY[lower(search_query)] THEN 3.0
          -- Medium score: Match in name
          WHEN p.name ILIKE '%' || search_query || '%' THEN 2.0
          -- Lower score: Match in keywords
          WHEN p.keywords @> ARRAY[lower(search_query)] THEN 1.0
          -- Base score: Match in description or partial match
          ELSE 0.5
        END +
        -- Bonus for exact matches
        CASE
          WHEN p.name ILIKE search_query THEN 1.0
          ELSE 0.0
        END +
        -- Popularity bonus (normalized between 0 and 1)
        LEAST(p.popularity::float / 1000, 1.0) * 0.5
      )::float as search_score
    FROM products p
    WHERE 
      p.is_active = true AND
      (
        search_query IS NULL OR
        p.name ILIKE '%' || search_query || '%' OR
        p.keywords @> ARRAY[lower(search_query)] OR
        to_tsvector('english',
          coalesce(p.name, '') || ' ' ||
          coalesce(p.description, '') || ' ' ||
          array_to_string(p.keywords, ' ')
        ) @@ to_tsquery('english', regexp_replace(search_query, '\s+', ':* & ', 'g') || ':*')
      ) AND
      (min_price IS NULL OR p.price >= min_price) AND
      (max_price IS NULL OR p.price <= max_price) AND
      (occasions IS NULL OR p.occasion && occasions) AND
      (profile_gender IS NULL OR p.gender = profile_gender::gender_type OR p.gender = 'unisex') AND
      (skin_tones IS NULL OR p.skin_tones && skin_tones) AND
      (undertones IS NULL OR p.undertones && undertones) AND
      (body_shapes IS NULL OR 
        (profile_gender = 'male' AND p.body_shapes_male && body_shapes) OR
        (profile_gender = 'female' AND p.body_shapes_female && body_shapes)
      )
  )
  SELECT 
    sr.id,
    sr.name,
    sr.description,
    sr.price,
    sr.image_url,
    sr.source_url,
    sr.occasion,
    sr.popularity,
    sr.is_active,
    sr.created_at,
    sr.updated_at,
    sr.relevance,
    sr.search_score
  FROM search_results sr
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' THEN
        CASE 
          WHEN sort_order = 'desc' THEN sr.search_score
          ELSE -sr.search_score
        END
    END DESC,
    CASE 
      WHEN sort_by = 'price' THEN
        CASE 
          WHEN sort_order = 'desc' THEN sr.price
          ELSE -sr.price
        END
    END DESC,
    CASE 
      WHEN sort_by = 'popularity' THEN
        CASE 
          WHEN sort_order = 'desc' THEN sr.popularity
          ELSE -sr.popularity
        END
    END DESC,
    CASE 
      WHEN sort_by = 'created_at' THEN
        CASE 
          WHEN sort_order = 'desc' THEN sr.created_at
          ELSE sr.created_at
        END
    END DESC
  LIMIT limit_val;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_products TO authenticated;