-- Create table for video annotations
CREATE TABLE IF NOT EXISTS public.video_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL,
  canvas_data JSONB NOT NULL,
  comment TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_annotations ENABLE ROW LEVEL SECURITY;

-- Public can view annotations by project share_id
CREATE POLICY "Public can view annotations by project share_id"
ON public.video_annotations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = video_annotations.project_id
    AND projects.share_id IS NOT NULL
  )
);

-- Public can create annotations by project share_id
CREATE POLICY "Public can create annotations by project share_id"
ON public.video_annotations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = video_annotations.project_id
    AND projects.share_id IS NOT NULL
  )
);

-- Public can update their own annotations
CREATE POLICY "Public can update annotations by project share_id"
ON public.video_annotations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = video_annotations.project_id
    AND projects.share_id IS NOT NULL
  )
);

-- Public can delete their own annotations
CREATE POLICY "Public can delete annotations by project share_id"
ON public.video_annotations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = video_annotations.project_id
    AND projects.share_id IS NOT NULL
  )
);

-- Create index for faster queries
CREATE INDEX idx_video_annotations_project_id ON public.video_annotations(project_id);
CREATE INDEX idx_video_annotations_timestamp ON public.video_annotations(timestamp_ms);

-- Create trigger for updated_at
CREATE TRIGGER update_video_annotations_updated_at
BEFORE UPDATE ON public.video_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();