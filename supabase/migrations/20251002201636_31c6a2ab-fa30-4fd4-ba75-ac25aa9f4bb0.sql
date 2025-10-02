-- Add feedback_round column to track feedback rounds
ALTER TABLE project_feedback 
ADD COLUMN feedback_round integer DEFAULT 1;

-- Add feedback_round column to track approval rounds
ALTER TABLE creative_approvals 
ADD COLUMN feedback_round integer DEFAULT 1;

-- Add current_feedback_round to projects to track the current round
ALTER TABLE projects 
ADD COLUMN current_feedback_round integer DEFAULT 1;

-- Create index for better performance on feedback_round queries
CREATE INDEX idx_project_feedback_round ON project_feedback(keyframe_id, feedback_round);
CREATE INDEX idx_creative_approvals_round ON creative_approvals(keyframe_id, feedback_round);