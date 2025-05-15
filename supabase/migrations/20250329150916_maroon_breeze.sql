/*
  # Fix search functionality
  
  1. Changes
    - Improve text search configuration
    - Fix keyword matching
    - Add proper text search indexes
    - Update search function to handle partial matches better
    
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing search function
DROP FUNCTION IF EXISTS public.search_products;

-- Create improved search function
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
  relevance float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_terms text[];
  search_pattern text;
BEGIN
  -- Split search query into terms
  search_terms := regexp_split_to_array(lower(search_query), '\s+');
  
  -- Create pattern for LIKE queries
  search_pattern := '%' || search_query || '%';
  
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      p.*,
      ts_rank(
        setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
        setweight(to_tsvector('english', array_to_string(p.keywords, ' ')), 'B') ||
        setweight(to_tsvector('english', coalesce(p.description, '')), 'C'),
        to_tsquery('english', array_to_string(array_agg(t || ':*'), ' & '))
      ) as relevance
    FROM products p,
         unnest(search_terms) t
    WHERE 
      p.is_active = true AND
      (
        -- Direct name match
        p.name ILIKE search_pattern OR
        -- Keyword match
        EXISTS (
          SELECT 1 
          FROM unnest(p.keywords) k 
          WHERE k ILIKE ANY(SELECT '%' || term || '%' FROM unnest(search_terms) term)
        ) OR
        -- Full text search match
        to_tsvector('english',
          coalesce(p.name, '') || ' ' ||
          array_to_string(p.keywords, ' ') || ' ' ||
          coalesce(p.description, '')
        ) @@ to_tsquery('english', 
          array_to_string(array_agg(t || ':*'), ' & ')
        )
      ) AND
      (min_price IS NULL OR p.price >= min_price) AND
      (max_price IS NULL OR p.price <= max_price) AND
      (occasions IS NULL OR p.occasion && occasions) AND
      (profile_gender IS NULL OR p.gender = profile_gender::gender_type) AND
      (skin_tones IS NULL OR p.skin_tones && skin_tones) AND
      (undertones IS NULL OR p.undertones && undertones) AND
      (body_shapes IS NULL OR 
        (profile_gender = 'male' AND p.body_shapes_male && body_shapes) OR
        (profile_gender = 'female' AND p.body_shapes_female && body_shapes)
      )
    GROUP BY p.id
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
    sr.relevance
  FROM search_results sr
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' AND sort_order = 'desc' THEN sr.relevance END DESC,
    CASE 
      WHEN sort_by = 'relevance' AND sort_order = 'asc' THEN sr.relevance END ASC,
    CASE 
      WHEN sort_by = 'price' AND sort_order = 'desc' THEN sr.price END DESC,
    CASE 
      WHEN sort_by = 'price' AND sort_order = 'asc' THEN sr.price END ASC,
    CASE 
      WHEN sort_by = 'popularity' AND sort_order = 'desc' THEN sr.popularity END DESC,
    CASE 
      WHEN sort_by = 'popularity' AND sort_order = 'asc' THEN sr.popularity END ASC
  LIMIT limit_val;
END;
$$;

-- Ensure proper indexes exist
DROP INDEX IF EXISTS products_name_tsv_idx;
DROP INDEX IF EXISTS products_description_tsv_idx;
DROP INDEX IF EXISTS products_keywords_idx;

CREATE INDEX products_name_tsv_idx ON products USING gin(to_tsvector('english', name));
CREATE INDEX products_description_tsv_idx ON products USING gin(to_tsvector('english', description));
CREATE INDEX products_keywords_idx ON products USING gin(keywords);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_products TO authenticated;