export const initials = (n) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ---------- Pièces jointes : mêmes limites que l'API ---------- */
export const MAX_FILES = 1; // une image facultative par plainte
export const MAX_MB = 10;
const ALLOWED_TYPES = /^image\/(png|jpeg|gif|webp)$/;
const ALLOWED_EXT = /\.(png|jpe?g|gif|webp)$/i;
export const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp';

// Preuves d'une enquête : photos ou courtes vidéos (mp4, webm), jusqu'à 25 Mo
export const MAX_MEDIA_MB = 25;
export const ACCEPT_MEDIA = ACCEPT + ',video/mp4,video/webm';
const MEDIA_TYPES = /^(image\/(png|jpeg|gif|webp)|video\/(mp4|webm))$/;
const MEDIA_EXT = /\.(png|jpe?g|gif|webp|mp4|webm)$/i;
export const isVideo = (type = '') => type.startsWith('video/');

export function checkMedia(file) {
  if (!MEDIA_TYPES.test(file.type) && !(file.type === '' && MEDIA_EXT.test(file.name))) {
    return `${file.name} is not supported. Use a photo (PNG, JPEG, GIF, WebP) or a short video (MP4, WebM).`;
  }
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_MEDIA_MB * 1024 * 1024) return `${file.name} is over ${MAX_MEDIA_MB} MB. Choose a smaller file.`;
  return null;
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Vérification côté navigateur pour un retour immédiat ; l'API revérifie le contenu réel du fichier.
export function checkFile(file) {
  if (!ALLOWED_TYPES.test(file.type) && !(file.type === '' && ALLOWED_EXT.test(file.name))) {
    return `${file.name} is not supported. Use a PNG, JPEG, GIF or WebP image.`;
  }
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_MB * 1024 * 1024) return `${file.name} is over ${MAX_MB} MB. Choose a smaller file.`;
  return null;
}
