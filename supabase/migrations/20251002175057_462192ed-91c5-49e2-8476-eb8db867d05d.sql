-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_project_id ON notifications(project_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Trigger function for project approval notifications
CREATE OR REPLACE FUNCTION notify_project_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO notifications (user_id, type, title, message, project_id, metadata)
    VALUES (
      NEW.user_id,
      'project_approved',
      'Projeto Aprovado',
      'Seu projeto "' || NEW.title || '" foi aprovado pelo cliente!',
      NEW.id,
      jsonb_build_object('project_title', NEW.title, 'client', NEW.client)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_project_approved
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_approved();

-- Trigger function for feedback sent notifications
CREATE OR REPLACE FUNCTION notify_feedback_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'feedback-sent' AND (OLD.status IS NULL OR OLD.status != 'feedback-sent') THEN
    INSERT INTO notifications (user_id, type, title, message, project_id, metadata)
    VALUES (
      NEW.user_id,
      'feedback_received',
      'Novo Retorno do Cliente',
      'O cliente enviou feedback no projeto "' || NEW.title || '"',
      NEW.id,
      jsonb_build_object('project_title', NEW.title, 'client', NEW.client)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_feedback_sent
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_feedback_sent();

-- Trigger function for new comments notifications
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Get project information
  SELECT p.* INTO project_record
  FROM project_keyframes kf
  JOIN projects p ON p.id = kf.project_id
  WHERE kf.id = NEW.keyframe_id;
  
  -- Notify project owner if the comment is not from them
  IF project_record.user_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, project_id, metadata)
    VALUES (
      project_record.user_id,
      'new_comment',
      'Novo Comentário',
      'Novo comentário adicionado no projeto "' || project_record.title || '"',
      project_record.id,
      jsonb_build_object('project_title', project_record.title, 'comment', LEFT(NEW.comment, 100))
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_comment
  AFTER INSERT ON project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();

-- Trigger function for comment responses
CREATE OR REPLACE FUNCTION notify_comment_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Only trigger if response was added
  IF NEW.response IS NOT NULL AND (OLD.response IS NULL OR OLD.response = '') THEN
    -- Get project information
    SELECT p.* INTO project_record
    FROM project_keyframes kf
    JOIN projects p ON p.id = kf.project_id
    WHERE kf.id = NEW.keyframe_id;
    
    -- Notify the user who made the comment
    IF NEW.user_id != project_record.user_id THEN
      INSERT INTO notifications (user_id, type, title, message, project_id, metadata)
      VALUES (
        NEW.user_id,
        'comment_response',
        'Resposta ao Comentário',
        'Sua solicitação no projeto "' || project_record.title || '" foi respondida',
        project_record.id,
        jsonb_build_object('project_title', project_record.title, 'response', LEFT(NEW.response, 100))
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_comment_response
  AFTER UPDATE ON project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_response();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;