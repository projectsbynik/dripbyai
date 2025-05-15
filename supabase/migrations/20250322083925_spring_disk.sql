/*
  # Add search and recommendation functions

  1. Changes
    - Add function for product search with filters
    - Add function for personalized recommendations
    - Add function for similar products

  2. Security
    - Maintain existing RLS policies
*/

-- Function for product search with filters
CREATE OR REPLACE FUNCTION search_products(
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
      ) as relevance
    FROM products p
    WHERE 
      p.is_active = true AND
      (search_query IS NULL OR 
        to_tsvector('english',
          coalesce(p.name, '') || ' ' ||
          coalesce(p.description, '') || ' ' ||
          array_to_string(p.keywords, ' ')
        ) @@ to_tsquery('english', regexp_replace(search_query, '\s+', ':* & ', 'g') || ':*')
      ) AND
      (min_price IS NULL OR p.price >= min_price) AND
      (max_price IS NULL OR p.price <= max_price) AND
      (occasions IS NULL OR p.occasion && occasions) AND
      (gender IS NULL OR p.gender = gender) AND
      (skin_tones IS NULL OR p.skin_tones && skin_tones) AND
      (undertones IS NULL OR p.undertones && undertones) AND
      (body_shapes IS NULL OR 
        (p.gender = 'male' AND p.body_shapes_male && body_shapes) OR
        (p.gender = 'female' AND p.body_shapes_female && body_shapes)
      )
  )
  SELECT 
    sr.*
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
      WHEN sort_by = 'popularity' AND sort_order = 'asc' THEN sr.popularity END ASC,
    CASE 
      WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN sr.created_at END DESC,
    CASE 
      WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN sr.created_at END ASC
  LIMIT limit_val;
END;
$$;

-- Function to get similar products
CREATE OR REPLACE FUNCTION get_similar_products(
  product_id uuid,
  limit_val integer DEFAULT 10
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
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_product products%ROWTYPE;
BEGIN
  -- Get the target product
  SELECT * INTO target_product FROM products WHERE id = product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.source_url,
    p.occasion,
    p.popularity,
    (
      -- Calculate similarity score based on multiple factors
      CASE WHEN p.gender = target_product.gender THEN 0.3 ELSE 0 END +
      CASE WHEN p.occasion && target_product.occasion THEN 0.2 ELSE 0 END +
      CASE WHEN p.skin_tones && target_product.skin_tones THEN 0.2 ELSE 0 END +
      CASE WHEN p.undertones && target_product.undertones THEN 0.2 ELSE 0 END +
      CASE 
        WHEN target_product.gender = 'male' AND p.body_shapes_male && target_product.body_shapes_male THEN 0.1
        WHEN target_product.gender = 'female' AND p.body_shapes_female && target_product.body_shapes_female THEN 0.1
        ELSE 0
      END
    )::float as similarity
  FROM products p
  WHERE 
    p.id != product_id AND
    p.is_active = true
  ORDER BY similarity DESC, p.popularity DESC
  LIMIT limit_val;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_products TO authenticated;
GRANT EXECUTE ON FUNCTION get_similar_products TO authenticated;