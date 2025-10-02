-- Drop the complex canvas_data column and add simple image-based columns
ALTER TABLE video_annotations 
  DROP COLUMN IF EXISTS canvas_data,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS timecode TEXT;

-- Add comment to clarify the new approach
COMMENT ON COLUMN video_annotations.image_url IS 'URL to the saved annotated video frame image (PNG/WebP)';
COMMENT ON COLUMN video_annotations.timecode IS 'Human-readable timecode (e.g., 00:02:15)';

-- Optional: Add index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_video_annotations_project_timestamp 
  ON video_annotations(project_id, timestamp_ms);