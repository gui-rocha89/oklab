-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  type TEXT NOT NULL,
  description TEXT,
  share_id TEXT NOT NULL UNIQUE,
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create project_keyframes table for feedback system
CREATE TABLE public.project_keyframes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  feedback_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_feedback table for individual feedback items
CREATE TABLE public.project_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyframe_id UUID NOT NULL REFERENCES public.project_keyframes(id) ON DELETE CASCADE,
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  comment TEXT NOT NULL,
  response TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_keyframes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Users can view projects they have access to" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects or managers can update all" 
ON public.projects 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
);

CREATE POLICY "Users can delete their own projects or managers can delete all" 
ON public.projects 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
);

-- Create policies for project_keyframes
CREATE POLICY "Users can view keyframes from accessible projects" 
ON public.project_keyframes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
    )
  )
);

CREATE POLICY "Users can manage keyframes from their projects or managers can manage all" 
ON public.project_keyframes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
    )
  )
);

-- Create policies for project_feedback
CREATE POLICY "Users can view feedback from accessible projects" 
ON public.project_feedback 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_keyframes kf
    JOIN public.projects p ON p.id = kf.project_id
    WHERE kf.id = keyframe_id AND (
      p.user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
    )
  )
);

CREATE POLICY "Users can create feedback on accessible projects" 
ON public.project_feedback 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.project_keyframes kf
    JOIN public.projects p ON p.id = kf.project_id
    WHERE kf.id = keyframe_id AND (
      p.user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
    )
  )
);

CREATE POLICY "Users can update their own feedback or project owners/managers can update all" 
ON public.project_feedback 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.project_keyframes kf
    JOIN public.projects p ON p.id = kf.project_id
    WHERE kf.id = keyframe_id AND (
      p.user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
    )
  )
);

CREATE POLICY "Users can delete their own feedback or project owners/managers can delete all" 
ON public.project_feedback 
FOR DELETE 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.project_keyframes kf
    JOIN public.projects p ON p.id = kf.project_id
    WHERE kf.id = keyframe_id AND (
      p.user_id = auth.uid() OR 
      get_user_role(auth.uid()) = ANY (ARRAY['supreme_admin'::app_role, 'manager'::app_role])
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_share_id ON public.projects(share_id);
CREATE INDEX idx_project_keyframes_project_id ON public.project_keyframes(project_id);
CREATE INDEX idx_project_feedback_keyframe_id ON public.project_feedback(keyframe_id);
CREATE INDEX idx_project_feedback_user_id ON public.project_feedback(user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_keyframes_updated_at
BEFORE UPDATE ON public.project_keyframes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_feedback_updated_at
BEFORE UPDATE ON public.project_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();