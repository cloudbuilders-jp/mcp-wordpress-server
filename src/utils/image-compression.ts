import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type {
  ImageCompressionConfig,
  CompressionResult,
  ImageMetadata,
} from '../types/image-compression.js';

const DEFAULT_SIZE_THRESHOLD = 1048576; // 1MB
const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1080;

export function getCompressionConfig(): ImageCompressionConfig {
  const enabled = process.env.IMAGE_COMPRESSION_ENABLED !== 'false';
  const sizeThreshold = parseInt(
    process.env.IMAGE_SIZE_THRESHOLD || String(DEFAULT_SIZE_THRESHOLD),
    10
  );
  const quality = parseInt(process.env.IMAGE_COMPRESSION_QUALITY || String(DEFAULT_QUALITY), 10);
  const maxWidth = parseInt(process.env.IMAGE_MAX_WIDTH || String(DEFAULT_MAX_WIDTH), 10);
  const maxHeight = parseInt(process.env.IMAGE_MAX_HEIGHT || String(DEFAULT_MAX_HEIGHT), 10);

  return {
    enabled,
    sizeThreshold: isNaN(sizeThreshold) ? DEFAULT_SIZE_THRESHOLD : sizeThreshold,
    quality: isNaN(quality) ? DEFAULT_QUALITY : Math.min(100, Math.max(1, quality)),
    maxWidth: isNaN(maxWidth) ? DEFAULT_MAX_WIDTH : maxWidth,
    maxHeight: isNaN(maxHeight) ? DEFAULT_MAX_HEIGHT : maxHeight,
  };
}

export async function getImageMetadata(filePath: string): Promise<ImageMetadata> {
  const metadata = await sharp(filePath).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    hasAlpha: metadata.hasAlpha || false,
  };
}

interface ShouldCompressResult {
  shouldCompress: boolean;
  reason: string;
  metadata: ImageMetadata | null;
  fileSize: number;
}

export async function shouldCompress(
  filePath: string,
  config: ImageCompressionConfig
): Promise<ShouldCompressResult> {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  // Check file size threshold
  if (fileSize <= config.sizeThreshold) {
    return {
      shouldCompress: false,
      reason: `File size (${fileSize} bytes) is under threshold (${config.sizeThreshold} bytes)`,
      metadata: null,
      fileSize,
    };
  }

  // Get image metadata
  let metadata: ImageMetadata;
  try {
    metadata = await getImageMetadata(filePath);
  } catch {
    return {
      shouldCompress: false,
      reason: 'Unable to read image metadata',
      metadata: null,
      fileSize,
    };
  }

  // Skip GIF (may be animated)
  if (metadata.format === 'gif') {
    return {
      shouldCompress: false,
      reason: 'GIF format skipped to preserve potential animation',
      metadata,
      fileSize,
    };
  }

  // Skip SVG (vector format)
  if (metadata.format === 'svg') {
    return {
      shouldCompress: false,
      reason: 'SVG format skipped (vector format)',
      metadata,
      fileSize,
    };
  }

  // Skip PNG with transparency
  if (metadata.format === 'png' && metadata.hasAlpha) {
    return {
      shouldCompress: false,
      reason: 'PNG with transparency skipped to preserve alpha channel',
      metadata,
      fileSize,
    };
  }

  // Supported formats for compression
  const compressibleFormats = ['jpeg', 'jpg', 'png', 'webp'];
  if (!compressibleFormats.includes(metadata.format)) {
    return {
      shouldCompress: false,
      reason: `Format '${metadata.format}' is not supported for compression`,
      metadata,
      fileSize,
    };
  }

  return {
    shouldCompress: true,
    reason: `File size (${fileSize} bytes) exceeds threshold (${config.sizeThreshold} bytes)`,
    metadata,
    fileSize,
  };
}

export async function compressImage(
  filePath: string,
  config: ImageCompressionConfig
): Promise<CompressionResult> {
  const decision = await shouldCompress(filePath, config);

  if (!decision.shouldCompress) {
    return {
      compressed: false,
      originalSize: decision.fileSize,
      compressedSize: decision.fileSize,
      filePath,
      isTemporary: false,
      reason: decision.reason,
    };
  }

  const metadata = decision.metadata!;
  const ext = path.extname(filePath);
  const tempPath = path.join(os.tmpdir(), `compressed-${Date.now()}${ext}`);

  let sharpInstance = sharp(filePath);

  // Apply quality compression based on format
  if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
    sharpInstance = sharpInstance.jpeg({ quality: config.quality });
  } else if (metadata.format === 'png') {
    sharpInstance = sharpInstance.png({
      quality: config.quality,
      compressionLevel: 9,
    });
  } else if (metadata.format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality: config.quality });
  }

  await sharpInstance.toFile(tempPath);

  let compressedSize = fs.statSync(tempPath).size;

  // If still over threshold, apply resize
  if (compressedSize > config.sizeThreshold) {
    const resizedPath = path.join(os.tmpdir(), `resized-${Date.now()}${ext}`);

    let resizeInstance = sharp(tempPath).resize({
      width: config.maxWidth,
      height: config.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Re-apply quality compression after resize
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      resizeInstance = resizeInstance.jpeg({ quality: config.quality });
    } else if (metadata.format === 'png') {
      resizeInstance = resizeInstance.png({
        quality: config.quality,
        compressionLevel: 9,
      });
    } else if (metadata.format === 'webp') {
      resizeInstance = resizeInstance.webp({ quality: config.quality });
    }

    await resizeInstance.toFile(resizedPath);

    // Cleanup first temp file
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    compressedSize = fs.statSync(resizedPath).size;

    return {
      compressed: true,
      originalSize: decision.fileSize,
      compressedSize,
      filePath: resizedPath,
      isTemporary: true,
      reason: 'Quality compression and resize applied',
    };
  }

  return {
    compressed: true,
    originalSize: decision.fileSize,
    compressedSize,
    filePath: tempPath,
    isTemporary: true,
    reason: 'Quality compression applied',
  };
}

export function cleanupCompressionTemp(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors - temporary files will be cleaned up by OS
    console.error(`Failed to cleanup temp file: ${filePath}`);
  }
}
