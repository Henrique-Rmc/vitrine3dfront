import imageCompression from 'browser-image-compression'
import heic2any from 'heic2any'

const HEIC_TYPES = ['image/heic', 'image/heif']

const COMPRESSION_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  initialQuality: 0.85,
  fileType: 'image/webp',
  useWebWorker: true,
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
  const converted = Array.isArray(blob) ? blob[0] : blob
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return new File([converted], newName, { type: 'image/jpeg' })
}

export function isHeic(file: File): boolean {
  return (
    HEIC_TYPES.includes(file.type) ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

export async function normalizeImage(file: File): Promise<File> {
  const normalized = isHeic(file) ? await convertHeicToJpeg(file) : file
  return imageCompression(normalized, COMPRESSION_OPTIONS)
}

// Keep old export for any existing callers
export async function compressImage(file: File): Promise<File> {
  return normalizeImage(file)
}
