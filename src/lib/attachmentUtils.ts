export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'video-link';
  mimeType: string;
  size: number;
  uploadedAt: string;
}

// Tipos de arquivo aceitos
export const ACCEPTED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const ALL_ACCEPTED_TYPES = [
  ...ACCEPTED_FILE_TYPES.image,
  ...ACCEPTED_FILE_TYPES.video,
  ...ACCEPTED_FILE_TYPES.document,
].join(',');

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_ATTACHMENTS = 5;

// Validar tipo de arquivo
export const isValidFileType = (file: File): boolean => {
  const allTypes = Object.values(ACCEPTED_FILE_TYPES).flat();
  return allTypes.includes(file.type);
};

// Validar tamanho do arquivo
export const isValidFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

// Formatar tamanho do arquivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Detectar tipo de arquivo
export const getFileType = (mimeType: string): Attachment['type'] => {
  if (ACCEPTED_FILE_TYPES.image.includes(mimeType)) return 'image';
  if (ACCEPTED_FILE_TYPES.video.includes(mimeType)) return 'video';
  if (ACCEPTED_FILE_TYPES.document.includes(mimeType)) return 'document';
  return 'document';
};

// Obter extensão do arquivo
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
};

// Validar link de vídeo
export const isValidVideoLink = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
  const loomRegex = /^(https?:\/\/)?(www\.)?loom\.com\/.+/;
  
  return youtubeRegex.test(url) || vimeoRegex.test(url) || loomRegex.test(url);
};

// Obter ID de vídeo do YouTube
export const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Obter ID de vídeo do Vimeo
export const getVimeoVideoId = (url: string): string | null => {
  const regExp = /vimeo\.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// Gerar thumbnail do YouTube
export const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

// Obter ícone por extensão
export const getFileIcon = (filename: string): { icon: string; color: string } => {
  const ext = getFileExtension(filename);
  
  const iconMap: Record<string, { icon: string; color: string }> = {
    // Documentos
    doc: { icon: '📄', color: 'bg-blue-100 text-blue-700' },
    docx: { icon: '📄', color: 'bg-blue-100 text-blue-700' },
    pdf: { icon: '📄', color: 'bg-red-100 text-red-700' },
    
    // Imagens
    jpg: { icon: '🖼️', color: 'bg-pink-100 text-pink-700' },
    jpeg: { icon: '🖼️', color: 'bg-pink-100 text-pink-700' },
    png: { icon: '🖼️', color: 'bg-pink-100 text-pink-700' },
    gif: { icon: '🖼️', color: 'bg-pink-100 text-pink-700' },
    webp: { icon: '🖼️', color: 'bg-pink-100 text-pink-700' },
    
    // Vídeos
    mp4: { icon: '📹', color: 'bg-purple-100 text-purple-700' },
    mov: { icon: '📹', color: 'bg-purple-100 text-purple-700' },
    avi: { icon: '📹', color: 'bg-purple-100 text-purple-700' },
    webm: { icon: '📹', color: 'bg-purple-100 text-purple-700' },
  };
  
  return iconMap[ext] || { icon: '📎', color: 'bg-gray-100 text-gray-700' };
};

// Sanitizar nome do arquivo
export const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};
