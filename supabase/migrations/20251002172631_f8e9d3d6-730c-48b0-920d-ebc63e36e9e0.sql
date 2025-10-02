-- Add attachments column to project_feedback table
ALTER TABLE project_feedback 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create storage bucket for feedback attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-attachments', 
  'feedback-attachments', 
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for feedback-attachments bucket
CREATE POLICY "Anyone can upload feedback attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'feedback-attachments');

CREATE POLICY "Anyone can view feedback attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback-attachments');

CREATE POLICY "Anyone can update their feedback attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'feedback-attachments');

CREATE POLICY "Anyone can delete feedback attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'feedback-attachments');