/**
 * Sistema de normalização de coordenadas de anotações
 * Resolução de referência: 1280x720 (HD padrão)
 * 
 * Todas as anotações são salvas nesta resolução de referência e
 * convertidas dinamicamente para a resolução de visualização.
 */

export const REFERENCE_WIDTH = 1280;
export const REFERENCE_HEIGHT = 720;

/**
 * Converte coordenadas da resolução atual para a resolução de referência
 */
export const convertToReferenceResolution = (
  objects: any[],
  currentWidth: number,
  currentHeight: number
): any[] => {
  if (currentWidth === 0 || currentHeight === 0) {
    console.error('❌ Dimensões inválidas para conversão:', { currentWidth, currentHeight });
    return objects;
  }

  const scaleX = REFERENCE_WIDTH / currentWidth;
  const scaleY = REFERENCE_HEIGHT / currentHeight;

  console.log('🔄 Convertendo para resolução de referência:', {
    from: `${currentWidth}x${currentHeight}`,
    to: `${REFERENCE_WIDTH}x${REFERENCE_HEIGHT}`,
    scaleX: scaleX.toFixed(3),
    scaleY: scaleY.toFixed(3)
  });

  return objects.map((obj, index) => {
    const converted = {
      ...obj,
      left: (obj.left || 0) * scaleX,
      top: (obj.top || 0) * scaleY,
      scaleX: (obj.scaleX || 1) * scaleX,
      scaleY: (obj.scaleY || 1) * scaleY,
      width: obj.width,
      height: obj.height,
    };
    
    if (index === 0) {
      console.log(`  Objeto 0: (${obj.left?.toFixed(1)}, ${obj.top?.toFixed(1)}) → (${converted.left.toFixed(1)}, ${converted.top.toFixed(1)})`);
    }
    
    return converted;
  });
};

/**
 * Converte coordenadas da resolução de referência para a resolução atual
 */
export const convertFromReferenceResolution = (
  objects: any[],
  currentWidth: number,
  currentHeight: number
): any[] => {
  if (currentWidth === 0 || currentHeight === 0) {
    console.error('❌ Dimensões inválidas para conversão:', { currentWidth, currentHeight });
    return objects;
  }

  const scaleX = currentWidth / REFERENCE_WIDTH;
  const scaleY = currentHeight / REFERENCE_HEIGHT;

  console.log('🔄 Convertendo da resolução de referência:', {
    from: `${REFERENCE_WIDTH}x${REFERENCE_HEIGHT}`,
    to: `${currentWidth}x${currentHeight}`,
    scaleX: scaleX.toFixed(3),
    scaleY: scaleY.toFixed(3)
  });

  return objects.map((obj, index) => {
    const converted = {
      ...obj,
      left: (obj.left || 0) * scaleX,
      top: (obj.top || 0) * scaleY,
      scaleX: (obj.scaleX || 1) * scaleX,
      scaleY: (obj.scaleY || 1) * scaleY,
      width: obj.width,
      height: obj.height,
    };
    
    if (index === 0) {
      console.log(`  Objeto 0: (${obj.left?.toFixed(1)}, ${obj.top?.toFixed(1)}) → (${converted.left.toFixed(1)}, ${converted.top.toFixed(1)})`);
    }
    
    return converted;
  });
};

/**
 * Calcula o fator de escala entre a resolução de referência e a atual
 */
export const getScaleFactor = (
  currentWidth: number,
  currentHeight: number
): { scaleX: number; scaleY: number } => {
  return {
    scaleX: currentWidth / REFERENCE_WIDTH,
    scaleY: currentHeight / REFERENCE_HEIGHT,
  };
};

/**
 * Normaliza dados do canvas para a resolução de referência antes de salvar
 */
export const normalizeCanvasData = (
  canvasData: any,
  currentWidth: number,
  currentHeight: number
): any => {
  const normalizedObjects = convertToReferenceResolution(
    canvasData.objects || [],
    currentWidth,
    currentHeight
  );

  return {
    ...canvasData,
    objects: normalizedObjects,
    width: REFERENCE_WIDTH,
    height: REFERENCE_HEIGHT,
    originalWidth: currentWidth,
    originalHeight: currentHeight,
  };
};
