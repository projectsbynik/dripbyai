-- ==============================================================================
-- DripbyAI - Complete Database Schema
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to set up the entire database.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. Custom Types & ENUMs
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE skin_tone_type AS ENUM ('fair', 'wheatish', 'brown', 'intense_dark');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE undertone_type AS ENUM ('warm', 'cool', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE body_shape_male_type AS ENUM ('rectangle', 'triangle', 'inverted_triangle', 'oval', 'trapezoid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE body_shape_female_type AS ENUM ('hourglass', 'pear', 'apple', 'rectangle', 'spoon', 'diamond', 'oval');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE country_type AS ENUM ('usa', 'india', 'uk');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Admin Column on auth.users
DO $$ BEGIN
  ALTER TABLE auth.users ADD COLUMN is_admin boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY CHECK (length(id) = 12),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER CHECK (age > 0),
  gender gender_type NOT NULL,
  country country_type NOT NULL,
  skin_tone skin_tone_type,
  undertone undertone_type,
  body_shape_male body_shape_male_type,
  body_shape_female body_shape_female_type,
  face_image_url TEXT,
  body_image_url TEXT,
  analysis_status TEXT DEFAULT 'pending',
  ai_confidence_score NUMERIC,
  analysis_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_body_shape CHECK (
    (gender = 'male' AND body_shape_female IS NULL AND (body_shape_male IS NOT NULL OR analysis_status IN ('pending', 'analyzing', 'error'))) OR
    (gender = 'female' AND body_shape_male IS NULL AND (body_shape_female IS NOT NULL OR analysis_status IN ('pending', 'analyzing', 'error')))
  )
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT NOT NULL,
  source_url TEXT,
  affiliate_link TEXT NOT NULL DEFAULT '',
  occasion TEXT[] NOT NULL DEFAULT '{}',
  popularity INTEGER DEFAULT 0 CHECK (popularity >= 0),
  is_active BOOLEAN DEFAULT true,
  gender gender_type,
  keywords TEXT[] DEFAULT '{}',
  skin_tones TEXT[] DEFAULT '{}',
  undertones TEXT[] DEFAULT '{}',
  body_shapes_male TEXT[] DEFAULT '{}',
  body_shapes_female TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, profile_id, product_id)
);

-- 7. Search Synonyms Table
CREATE TABLE IF NOT EXISTS public.search_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  synonyms TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Indexes for Performance and Search
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products(gender);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_popularity ON public.products(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_keywords ON public.products USING gin (keywords);
CREATE INDEX IF NOT EXISTS idx_products_occasion ON public.products USING gin (occasion);
CREATE INDEX IF NOT EXISTS idx_search_synonyms_word ON public.search_synonyms (lower(word));
CREATE INDEX IF NOT EXISTS idx_wishlists_user_profile ON public.wishlists(user_id, profile_id);

-- 10. Helper Functions & Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Admin check helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Admin action logger
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action text,
  entity_type text,
  entity_id text,
  old_values jsonb DEFAULT NULL,
  new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  INSERT INTO public.admin_audit_logs (
    admin_id, action, entity_type, entity_id, old_values, new_values
  ) VALUES (
    auth.uid(), action, entity_type, entity_id, old_values, new_values
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;

-- Product stats for Admin Console
CREATE OR REPLACE FUNCTION public.get_product_stats()
RETURNS TABLE (
  total_products bigint,
  active_products bigint,
  inactive_products bigint,
  total_value numeric,
  avg_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can view product stats';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::bigint FROM public.products) as total_products,
    (SELECT COUNT(*)::bigint FROM public.products WHERE is_active = true) as active_products,
    (SELECT COUNT(*)::bigint FROM public.products WHERE is_active = false OR is_active IS NULL) as inactive_products,
    (SELECT COALESCE(SUM(price), 0) FROM public.products) as total_value,
    (SELECT COALESCE(AVG(price), 0) FROM public.products) as avg_price;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_product_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.count_products()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::bigint FROM public.products;
$$;
GRANT EXECUTE ON FUNCTION public.count_products() TO authenticated;

-- Synonym retrieval
CREATE OR REPLACE FUNCTION public.get_word_synonyms(input_word text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  synonym_list text[];
BEGIN
  SELECT synonyms INTO synonym_list
  FROM public.search_synonyms
  WHERE lower(word) = lower(input_word);
  
  RETURN COALESCE(synonym_list, ARRAY[]::text[]);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_word_synonyms TO authenticated;

-- Advanced Search RPC
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
  clean_query := lower(trim(search_query));
  search_terms := string_to_array(clean_query, ' ');
  expanded_terms := ARRAY[]::text[];
  
  IF search_terms IS NOT NULL THEN
    FOREACH term IN ARRAY search_terms
    LOOP
      synonyms := public.get_word_synonyms(term);
      IF array_length(synonyms, 1) > 0 THEN
        expanded_terms := expanded_terms || synonyms;
      END IF;
      expanded_terms := expanded_terms || term;
    END LOOP;
  END IF;

  RETURN QUERY
  WITH scored_products AS (
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.image_url,
      p.source_url,
      p.occasion,
      p.popularity,
      p.is_active,
      p.gender,
      p.skin_tones,
      p.undertones,
      p.body_shapes_male,
      p.body_shapes_female,
      p.created_at,
      p.updated_at,
      GREATEST(
        CASE WHEN clean_query = ANY(p.keywords) THEN 10.0 ELSE 0.0 END,
        CASE WHEN lower(p.name) = clean_query THEN 8.0
             WHEN p.name ILIKE clean_query THEN 7.0
             WHEN p.name ILIKE '%' || clean_query || '%' THEN 6.0
             ELSE 0.0 
        END,
        CASE WHEN EXISTS (
          SELECT 1 FROM unnest(p.keywords) k 
          WHERE k ILIKE '%' || clean_query || '%'
        ) THEN 5.0 ELSE 0.0 END,
        CASE WHEN EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) THEN 4.0 ELSE 0.0 END,
        CASE WHEN p.description ILIKE '%' || clean_query || '%' THEN 2.0 
             ELSE 0.0 
        END
      ) * (1.0 + LEAST(COALESCE(p.popularity, 0)::float / 1000, 1.0)) as relevance,
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
    FROM public.products p
    WHERE 
      p.is_active = true AND
      (
        clean_query = '' OR clean_query IS NULL OR
        clean_query = ANY(p.keywords) OR
        lower(p.name) = clean_query OR
        p.name ILIKE clean_query OR
        p.name ILIKE '%' || clean_query || '%' OR
        EXISTS (
          SELECT 1 FROM unnest(p.keywords) k 
          WHERE k ILIKE '%' || clean_query || '%'
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(expanded_terms) t
          WHERE p.name ILIKE '%' || t || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.keywords) k 
            WHERE k ILIKE '%' || t || '%'
          )
        ) OR
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
      WHEN sort_by = 'relevance' AND sort_order = 'desc' THEN sp.relevance END DESC NULLS LAST,
    CASE 
      WHEN sort_by = 'relevance' AND sort_order = 'asc' THEN sp.relevance END ASC NULLS LAST,
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
GRANT EXECUTE ON FUNCTION public.search_products TO authenticated, anon;

-- 11. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can create their own profiles" ON public.profiles;
CREATE POLICY "Users can create their own profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
CREATE POLICY "Users can view their own profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;
CREATE POLICY "Users can delete their own profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Products Policies
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Wishlists Policies
DROP POLICY IF EXISTS "Users can manage their wishlists" ON public.wishlists;
CREATE POLICY "Users can manage their wishlists"
  ON public.wishlists FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Synonyms Policies
DROP POLICY IF EXISTS "Anyone can read search synonyms" ON public.search_synonyms;
CREATE POLICY "Anyone can read search synonyms"
  ON public.search_synonyms FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins can manage search synonyms" ON public.search_synonyms;
CREATE POLICY "Admins can manage search synonyms"
  ON public.search_synonyms FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

-- 12. Storage Bucket Setup & Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
CREATE POLICY "Public can view profile images"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Authenticated users can delete profile images" ON storage.objects;
CREATE POLICY "Authenticated users can delete profile images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images');
