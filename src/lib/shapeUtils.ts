import type { Pt, Shape } from '@/types/review';

/**
 * Normaliza um ponto para coordenadas 0..1 baseado nas dimensões do vídeo
 */
export const normalizePoint = (
  x: number,
  y: number,
  videoWidth: number,
  videoHeight: number
): Pt => ({
  x: x / videoWidth,
  y: y / videoHeight
});

/**
 * Desnormaliza um ponto de coordenadas 0..1 para pixels
 */
export const denormalizePoint = (
  pt: Pt,
  videoWidth: number,
  videoHeight: number
): { x: number; y: number } => ({
  x: pt.x * videoWidth,
  y: pt.y * videoHeight
});

/**
 * Normaliza todos os pontos de uma shape
 */
export const normalizeShape = (
  shape: Shape,
  videoWidth: number,
  videoHeight: number
): Shape => ({
  ...shape,
  points: shape.points.map(pt => normalizePoint(pt.x, pt.y, videoWidth, videoHeight))
});

/**
 * Desnormaliza todos os pontos de uma shape
 */
export const denormalizeShape = (
  shape: Shape,
  videoWidth: number,
  videoHeight: number
): Shape => ({
  ...shape,
  points: shape.points.map(pt => denormalizePoint(pt, videoWidth, videoHeight))
});

/**
 * Serializa shapes para JSON (para salvar no banco)
 */
export const serializeShapes = (shapes: Shape[]): string => {
  return JSON.stringify(shapes);
};

/**
 * Deserializa shapes do JSON
 */
export const deserializeShapes = (json: string): Shape[] => {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};
