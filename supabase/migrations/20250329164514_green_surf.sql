/*
  # Fix search function column ambiguity

  1. Changes
    - Fix ambiguous column references by properly qualifying them with table aliases
    - Improve search query performance
    - Maintain existing functionality
    
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing search function
DROP FUNCTION IF EXISTS public.search_products;

-- Create fixed search function
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
BEGIN
  -- Clean and prepare search query
  search_query := lower(trim(search_query));
  search_terms := string_to_array(search_query, ' ');
  
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
        -- Exact match score
        CASE WHEN p.name ILIKE search_query THEN 5.0
             WHEN p.name ILIKE '%' || search_query || '%' THEN 4.0
             ELSE 0.0 
        END,
        
        -- Phrase match score
        CASE WHEN EXISTS (
          SELECT 1 FROM unnest(p.keywords) k 
          WHERE k ILIKE '%' || search_query || '%'
        ) THEN 3.0 ELSE 0.0 END,
        
        -- Word match score
        CASE WHEN EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) THEN 2.0 ELSE 0.0 END,
        
        -- Fuzzy match score
        CASE WHEN EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE levenshtein(lower(p.name), t) <= 2
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE levenshtein(lower(k), t) <= 2
          )
        ) THEN 1.0 ELSE 0.0 END
      ) * (1.0 + LEAST(p.popularity::float / 1000, 1.0)) as relevance,
      
      -- Determine match type
      CASE 
        WHEN p.name ILIKE search_query THEN 'Exact Match'
        WHEN p.name ILIKE '%' || search_query || '%' THEN 'Phrase Match'
        WHEN EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) THEN 'Word Match'
        WHEN EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE levenshtein(lower(p.name), t) <= 2
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE levenshtein(lower(k), t) <= 2
          )
        ) THEN 'Fuzzy Match'
        ELSE 'Partial Match'
      END as match_type
    FROM products p
    WHERE 
      p.is_active = true AND
      (
        -- Exact match
        p.name ILIKE search_query OR
        -- Phrase match
        p.name ILIKE '%' || search_query || '%' OR
        EXISTS (
          SELECT 1 FROM unnest(p.keywords) k 
          WHERE k ILIKE '%' || search_query || '%'
        ) OR
        -- Word match with synonyms
        EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) OR
        -- Fuzzy match
        EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE levenshtein(lower(p.name), t) <= 2
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE levenshtein(lower(k), t) <= 2
          )
        )
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
    (profile_gender IS NULL OR sp.gender = profile_gender::gender_type OR sp.gender = 'unisex') AND
    (skin_tones IS NULL OR sp.skin_tones && skin_tones) AND
    (undertones IS NULL OR sp.undertones && undertones) AND
    (body_shapes IS NULL OR 
      (profile_gender = 'male' AND sp.body_shapes_male && body_shapes) OR
      (profile_gender = 'female' AND sp.body_shapes_female && body_shapes)
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