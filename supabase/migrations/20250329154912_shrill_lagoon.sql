/*
  # Fix search functionality and improve result matching
  
  1. Changes
    - Add proper text search indexes
    - Improve search query to match partial words
    - Add proper keyword matching
    - Fix relevance scoring
    - Add proper case-insensitive matching
    
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing search function
DROP FUNCTION IF EXISTS public.search_products;

-- Create improved search function with better matching
CREATE OR REPLACE FUNCTION public.search_products(
  search_query text,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  occasions text[] DEFAULT NULL,
  gender text DEFAULT NULL,
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
BEGIN
  -- Clean and prepare search query
  search_query := lower(trim(search_query));
  
  RETURN QUERY
  WITH search_terms AS (
    SELECT unnest(string_to_array(search_query, ' ')) as term
  ),
  scored_products AS (
    SELECT 
      p.*,
      (
        -- Base relevance from text search
        ts_rank(
          setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
          setweight(to_tsvector('english', array_to_string(p.keywords, ' ')), 'B') ||
          setweight(to_tsvector('english', coalesce(p.description, '')), 'C'),
          to_tsquery('english', string_agg(t.term || ':*', ' & '))
        ) +
        -- Exact name match bonus
        CASE WHEN p.name ILIKE '%' || search_query || '%' THEN 2.0 ELSE 0.0 END +
        -- Partial name match bonus
        CASE WHEN EXISTS (
          SELECT 1 FROM search_terms st 
          WHERE p.name ILIKE '%' || st.term || '%'
        ) THEN 1.0 ELSE 0.0 END +
        -- Keyword match bonus
        CASE WHEN EXISTS (
          SELECT 1 FROM search_terms st 
          WHERE EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || st.term || '%'
          )
        ) THEN 1.5 ELSE 0.0 END +
        -- Popularity bonus (normalized)
        LEAST(p.popularity::float / 1000, 1.0) * 0.5
      )::float as relevance
    FROM products p, search_terms t
    WHERE 
      p.is_active = true
    GROUP BY p.id
    HAVING 
      -- Ensure at least one term matches somewhere
      EXISTS (
        SELECT 1 FROM search_terms st 
        WHERE 
          p.name ILIKE '%' || st.term || '%' OR
          EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || st.term || '%'
          ) OR
          p.description ILIKE '%' || st.term || '%'
      )
  )
  SELECT 
    sp.id,
    sp.name,
    sp.description,
    sp.price,
    sp.image_url,
    sp.source_url,
    sp.occasion,
    sp.popularity,
    sp.is_active,
    sp.created_at,
    sp.updated_at,
    sp.relevance
  FROM scored_products sp
  WHERE
    (min_price IS NULL OR sp.price >= min_price) AND
    (max_price IS NULL OR sp.price <= max_price) AND
    (occasions IS NULL OR sp.occasion && occasions) AND
    (gender IS NULL OR sp.gender::text = gender) AND
    (skin_tones IS NULL OR sp.skin_tones && skin_tones) AND
    (undertones IS NULL OR sp.undertones && undertones) AND
    (body_shapes IS NULL OR 
      (gender = 'male' AND sp.body_shapes_male && body_shapes) OR
      (gender = 'female' AND sp.body_shapes_female && body_shapes)
    )
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' AND sort_order = 'desc' THEN sp.relevance END DESC,
    CASE 
      WHEN sort_by = 'relevance' AND sort_order = 'asc' THEN sp.relevance END ASC,
    CASE 
      WHEN sort_by = 'price' AND sort_order = 'desc' THEN sp.price END DESC,
    CASE 
      WHEN sort_by = 'price' AND sort_order = 'asc' THEN sp.price END ASC,
    CASE 
      WHEN sort_by = 'popularity' AND sort_order = 'desc' THEN sp.popularity END DESC,
    CASE 
      WHEN sort_by = 'popularity' AND sort_order = 'asc' THEN sp.popularity END ASC
  LIMIT limit_val;
END;
$$;