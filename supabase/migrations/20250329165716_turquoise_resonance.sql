/*
  # Enhance search functionality for exact keyword matches
  
  1. Changes
    - Improve exact match detection
    - Add direct keyword matching
    - Increase relevance score for exact matches
    - Add array overlap check for keywords
    - Add case-insensitive exact match check
    
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing search function
DROP FUNCTION IF EXISTS public.search_products;

-- Create enhanced search function
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
  match_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_terms text[];
  expanded_terms text[];
  term text;
  synonyms text[];
  clean_query text;
BEGIN
  -- Clean and prepare search query
  clean_query := lower(trim(search_query));
  search_terms := string_to_array(clean_query, ' ');
  
  -- Expand search terms with synonyms
  expanded_terms := ARRAY[]::text[];
  FOREACH term IN ARRAY search_terms
  LOOP
    synonyms := get_word_synonyms(term);
    IF array_length(synonyms, 1) > 0 THEN
      expanded_terms := expanded_terms || synonyms;
    END IF;
    expanded_terms := expanded_terms || term;
  END LOOP;
  
  RETURN QUERY
  WITH scored_products AS (
    SELECT 
      p.*,
      GREATEST(
        -- Direct keyword match (highest priority)
        CASE WHEN clean_query = ANY(p.keywords) THEN 10.0 ELSE 0.0 END,
        
        -- Exact name match
        CASE WHEN lower(p.name) = clean_query THEN 8.0
             WHEN p.name ILIKE clean_query THEN 7.0
             WHEN p.name ILIKE '%' || clean_query || '%' THEN 6.0
             ELSE 0.0 
        END,
        
        -- Keyword partial match
        CASE WHEN EXISTS (
          SELECT 1 FROM unnest(p.keywords) k 
          WHERE k ILIKE '%' || clean_query || '%'
        ) THEN 5.0 ELSE 0.0 END,
        
        -- Word match with synonyms
        CASE WHEN EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) THEN 4.0 ELSE 0.0 END,
        
        -- Description match
        CASE WHEN p.description ILIKE '%' || clean_query || '%' THEN 2.0 
             ELSE 0.0 
        END
      ) * (1.0 + LEAST(p.popularity::float / 1000, 1.0)) as relevance,
      
      -- Determine match type
      CASE 
        WHEN clean_query = ANY(p.keywords) THEN 'Exact Keyword Match'
        WHEN lower(p.name) = clean_query THEN 'Exact Name Match'
        WHEN p.name ILIKE clean_query THEN 'Case-Insensitive Match'
        WHEN p.name ILIKE '%' || clean_query || '%' THEN 'Name Contains'
        WHEN EXISTS (
          SELECT 1 FROM unnest(p.keywords) k 
          WHERE k ILIKE '%' || clean_query || '%'
        ) THEN 'Keyword Contains'
        WHEN EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) THEN 'Synonym Match'
        ELSE 'Description Match'
      END as match_type
    FROM products p
    WHERE 
      p.is_active = true AND
      (
        -- Direct keyword match
        clean_query = ANY(p.keywords) OR
        -- Exact name match
        lower(p.name) = clean_query OR
        -- Case-insensitive matches
        p.name ILIKE clean_query OR
        p.name ILIKE '%' || clean_query || '%' OR
        -- Keyword matches
        EXISTS (
          SELECT 1 FROM unnest(p.keywords) k 
          WHERE k ILIKE '%' || clean_query || '%'
        ) OR
        -- Synonym matches
        EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) OR
        -- Description match
        p.description ILIKE '%' || clean_query || '%'
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
    sp.relevance,
    sp.match_type
  FROM scored_products sp
  WHERE
    (min_price IS NULL OR sp.price >= min_price) AND
    (max_price IS NULL OR sp.price <= max_price) AND
    (occasions IS NULL OR sp.occasion && occasions) AND
    (profile_gender IS NULL OR sp.gender = profile_gender::gender_type) AND
    (skin_tones IS NULL OR sp.skin_tones && ARRAY[skin_tones[1]]::text[]) AND
    (undertones IS NULL OR sp.undertones && ARRAY[undertones[1]]::text[]) AND
    (body_shapes IS NULL OR 
      (profile_gender = 'male' AND sp.body_shapes_male && ARRAY[body_shapes[1]]::text[]) OR
      (profile_gender = 'female' AND sp.body_shapes_female && ARRAY[body_shapes[1]]::text[])
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_products TO authenticated;