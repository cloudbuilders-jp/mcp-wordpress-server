export interface ImageCompressionConfig {
  enabled: boolean;
  sizeThreshold: number; // bytes
  quality: number; // 1-100
  maxWidth: number; // pixels
  maxHeight: number; // pixels
}

export interface CompressionResult {
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  filePath: string;
  isTemporary: boolean;
  reason?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  hasAlpha: boolean;
}
