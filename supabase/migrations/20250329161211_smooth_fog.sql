/*
  # Enhanced Search with Advanced Matching

  1. Changes
    - Add fuzzy search using Levenshtein distance
    - Add synonym matching
    - Fix gin index operator class issue
    - Add proper text search indexes
    - Add function to get synonyms

  2. Security
    - Maintain existing RLS policies
*/

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Create table for synonyms
CREATE TABLE IF NOT EXISTS search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  synonyms text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for word lookup
CREATE INDEX IF NOT EXISTS idx_search_synonyms_word ON search_synonyms USING btree (word);

-- Insert some common fashion-related synonyms
INSERT INTO search_synonyms (word, synonyms) VALUES
  ('shirt', ARRAY['tee', 't-shirt', 'top', 'blouse']),
  ('pants', ARRAY['trousers', 'slacks', 'bottoms']),
  ('dress', ARRAY['gown', 'frock']),
  ('shoes', ARRAY['footwear', 'sneakers', 'boots']),
  ('jacket', ARRAY['coat', 'blazer', 'outerwear'])
ON CONFLICT DO NOTHING;

-- Function to get synonyms for a word
CREATE OR REPLACE FUNCTION get_word_synonyms(input_word text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  synonym_list text[];
BEGIN
  SELECT synonyms INTO synonym_list
  FROM search_synonyms
  WHERE word = lower(input_word);
  
  RETURN COALESCE(synonym_list, ARRAY[]::text[]);
END;
$$;

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
    (profile_gender IS NULL OR sp.gender = profile_gender::gender_type) AND
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

-- Create text search indexes (fixed version)
CREATE INDEX IF NOT EXISTS idx_products_name_tsv ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_tsv ON products USING gin(to_tsvector('english', description));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.search_products TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_word_synonyms TO authenticated;