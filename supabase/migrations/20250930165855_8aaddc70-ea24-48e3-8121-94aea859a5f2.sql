-- Add video_url column to projects table for audiovisual projects
ALTER TABLE projects 
ADD COLUMN video_url text;

-- Add comment to document the column
COMMENT ON COLUMN projects.video_url IS 'URL of the uploaded video file for audiovisual projects';