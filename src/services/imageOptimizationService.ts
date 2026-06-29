import imageCompression from 'browser-image-compression'

const COMPRESSION_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  fileType: 'image/webp',
  useWebWorker: true,
}

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, COMPRESSION_OPTIONS)
}
