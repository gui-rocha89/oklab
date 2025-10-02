-- Add columns to project_feedback table for adjustment management
ALTER TABLE project_feedback
ADD COLUMN resolved boolean DEFAULT false,
ADD COLUMN resolved_at timestamp with time zone,
ADD COLUMN team_response text,
ADD COLUMN team_attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN team_user_id uuid REFERENCES auth.users(id);

-- Add index for resolved status
CREATE INDEX idx_project_feedback_resolved ON project_feedback(resolved);

-- Create function to notify when comment is resolved
CREATE OR REPLACE FUNCTION public.notify_comment_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_record RECORD;
BEGIN
  IF NEW.resolved = true AND (OLD.resolved IS NULL OR OLD.resolved = false) THEN
    -- Get project information
    SELECT p.* INTO project_record
    FROM project_keyframes kf
    JOIN projects p ON p.id = kf.project_id
    WHERE kf.id = NEW.keyframe_id;
    
    -- Notify project owner if different from resolver
    IF project_record.user_id != NEW.team_user_id THEN
      INSERT INTO notifications (user_id, type, title, message, project_id, metadata)
      VALUES (
        project_record.user_id,
        'comment_resolved',
        'Ajuste Resolvido',
        'Um ajuste no projeto "' || project_record.title || '" foi marcado como resolvido',
        project_record.id,
        jsonb_build_object('project_title', project_record.title, 'comment', LEFT(NEW.comment, 100))
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for resolved comments
CREATE TRIGGER trigger_comment_resolved
  AFTER UPDATE ON project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_resolved();

-- Create function to notify when video is resent
CREATE OR REPLACE FUNCTION public.notify_video_resent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'in-revision' AND (OLD.status IS NULL OR OLD.status != 'in-revision') THEN
    INSERT INTO notifications (user_id, type, title, message, project_id, metadata)
    VALUES (
      NEW.user_id,
      'video_resent',
      'Vídeo Corrigido Reenviado',
      'O projeto "' || NEW.title || '" foi corrigido e está pronto para revisão',
      NEW.id,
      jsonb_build_object('project_title', NEW.title, 'client', NEW.client)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for video resent
CREATE TRIGGER trigger_video_resent
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_video_resent();