-- Update audiovisual-projects bucket to accept only MP4 and MOV files
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']
WHERE id = 'audiovisual-projects';