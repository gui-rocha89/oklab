-- Create table for individual creative approvals
CREATE TABLE public.creative_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyframe_id UUID NOT NULL REFERENCES project_keyframes(id) ON DELETE CASCADE,
  attachment_index INTEGER NOT NULL,
  caption TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to ensure one approval per attachment
  UNIQUE(keyframe_id, attachment_index)
);

-- Enable RLS
ALTER TABLE public.creative_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view approvals by project share_id" 
ON public.creative_approvals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM project_keyframes kf
    JOIN projects p ON p.id = kf.project_id
    WHERE kf.id = creative_approvals.keyframe_id 
    AND p.share_id IS NOT NULL
  )
);

CREATE POLICY "Public can manage approvals by project share_id" 
ON public.creative_approvals 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_keyframes kf
    JOIN projects p ON p.id = kf.project_id
    WHERE kf.id = creative_approvals.keyframe_id 
    AND p.share_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_keyframes kf
    JOIN projects p ON p.id = kf.project_id
    WHERE kf.id = creative_approvals.keyframe_id 
    AND p.share_id IS NOT NULL
  )
);

-- Create trigger for timestamp updates
CREATE TRIGGER update_creative_approvals_updated_at
BEFORE UPDATE ON public.creative_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();