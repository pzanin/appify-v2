-- Run this in the Supabase SQL Editor to add missing columns
-- ============================================================

-- Add cover_image_url and external_link to modules table
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Add cover_image_url and external_link to submodules table
ALTER TABLE submodules
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('modules', 'submodules')
  AND column_name IN ('cover_image_url', 'external_link', 'position', 'content_html', 'builder_data')
ORDER BY table_name, column_name;
