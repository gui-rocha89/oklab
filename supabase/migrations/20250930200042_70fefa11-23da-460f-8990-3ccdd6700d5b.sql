-- Add completed_at field to projects table to track when project was finalized
ALTER TABLE public.projects 
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX idx_projects_completed_at ON public.projects(completed_at);

-- Add comment to document the field
COMMENT ON COLUMN public.projects.completed_at IS 'Timestamp when the client completed their review (approved or sent feedback)';