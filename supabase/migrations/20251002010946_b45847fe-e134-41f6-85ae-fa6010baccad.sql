-- Limpar completamente projetos audiovisuais para nova simulação de aprovação

-- 1. Deletar todas as anotações de vídeo dos projetos audiovisuais
DELETE FROM video_annotations
WHERE project_id IN (
  SELECT id FROM projects WHERE type = 'Audiovisual'
);

-- 2. Deletar todas as avaliações da plataforma dos projetos audiovisuais
DELETE FROM platform_reviews
WHERE project_id IN (
  SELECT id FROM projects WHERE type = 'Audiovisual'
);

-- 3. Deletar aprovações criativas relacionadas aos keyframes dos projetos audiovisuais
DELETE FROM creative_approvals
WHERE keyframe_id IN (
  SELECT kf.id 
  FROM project_keyframes kf
  JOIN projects p ON p.id = kf.project_id
  WHERE p.type = 'Audiovisual'
);

-- 4. Deletar feedback dos keyframes dos projetos audiovisuais
DELETE FROM project_feedback
WHERE keyframe_id IN (
  SELECT kf.id 
  FROM project_keyframes kf
  JOIN projects p ON p.id = kf.project_id
  WHERE p.type = 'Audiovisual'
);

-- 5. Deletar keyframes dos projetos audiovisuais
DELETE FROM project_keyframes
WHERE project_id IN (
  SELECT id FROM projects WHERE type = 'Audiovisual'
);

-- 6. Resetar status e datas dos projetos audiovisuais
UPDATE projects
SET 
  status = 'pending',
  completed_at = NULL,
  approval_date = NULL
WHERE type = 'Audiovisual';