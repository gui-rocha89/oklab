-- Create project_downloads table to track client downloads
CREATE TABLE public.project_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_ip TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  files_downloaded JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_downloads ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing downloads (project owners can see their downloads)
CREATE POLICY "Users can view downloads for their projects"
ON public.project_downloads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE public.projects.id = public.project_downloads.project_id
  )
);

-- Create policy for inserting downloads (anyone can log downloads via share_id)
CREATE POLICY "Anyone can log downloads"
ON public.project_downloads
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_project_downloads_project_id ON public.project_downloads(project_id);
CREATE INDEX idx_project_downloads_downloaded_at ON public.project_downloads(downloaded_at);