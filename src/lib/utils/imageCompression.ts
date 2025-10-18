import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  preserveExif?: boolean;
  initialQuality?: number;
  fileType?: string;
  onProgress?: (percentage: number) => void;
  signal?: AbortSignal;
}

export interface ImageValidationOptions {
  allowedTypes?: string[];
  maxSizeKB?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const COMPRESSION_PRESETS = {
  AVATAR: {
    maxSizeMB: 0.02, // 20KB
    maxWidthOrHeight: 200,
    useWebWorker: true,
    preserveExif: false,
    initialQuality: 0.8,
  },
  THUMBNAIL: {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 400,
    useWebWorker: true,
    preserveExif: false,
    initialQuality: 0.85,
  },
  BRANDING: {
    maxSizeMB: 0.3, // 300KB
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    preserveExif: true,
    initialQuality: 0.9,
  },
  GENERAL: {
    maxSizeMB: 1, // 1MB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    preserveExif: true,
    initialQuality: 0.9,
  },
} as const;

export const DEFAULT_VALIDATION: ImageValidationOptions = {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeKB: 20,
  minWidth: 50,
  minHeight: 50,
};

export class ImageProcessor {
  private options: CompressionOptions;
  private validation: ImageValidationOptions;

  constructor(
    compressionOptions: CompressionOptions = COMPRESSION_PRESETS.AVATAR,
    validationOptions: ImageValidationOptions = DEFAULT_VALIDATION,
  ) {
    this.options = compressionOptions;
    this.validation = validationOptions;
  }

  async processImage(file: File): Promise<File> {
    await this.validateFile(file);
    return await this.compressImage(file);
  }

  async compressImage(file: File): Promise<File> {
    // Skip compression for SVG files as they are vector-based
    if (file.type === "image/svg+xml") {
      return file;
    }

    try {
      const compressedFile = await imageCompression(file, this.options);
      return compressedFile;
    } catch (error) {
      console.error("Image compression failed:", error);
      throw new Error("Failed to compress image");
    }
  }

  async validateFile(file: File): Promise<boolean> {
    const {
      allowedTypes,
      maxSizeKB,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
    } = this.validation;

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    // Check file size
    if (maxSizeKB) {
      const maxSizeBytes = maxSizeKB * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`File size must be less than ${maxSizeKB}KB`);
      }
    }

    // Check dimensions if specified
    if (minWidth || minHeight || maxWidth || maxHeight) {
      return await this.validateImageDimensions(file);
    }

    return true;
  }

  private async validateImageDimensions(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const { minWidth, minHeight, maxWidth, maxHeight } = this.validation;
        const { width, height } = img;

        if (minWidth && width < minWidth) {
          reject(new Error(`Image width must be at least ${minWidth}px`));
          return;
        }

        if (minHeight && height < minHeight) {
          reject(new Error(`Image height must be at least ${minHeight}px`));
          return;
        }

        if (maxWidth && width > maxWidth) {
          reject(new Error(`Image width must be at most ${maxWidth}px`));
          return;
        }

        if (maxHeight && height > maxHeight) {
          reject(new Error(`Image height must be at most ${maxHeight}px`));
          return;
        }

        URL.revokeObjectURL(url);
        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for validation"));
      };

      img.src = url;
    });
  }

  static createAvatarProcessor(): ImageProcessor {
    return new ImageProcessor(COMPRESSION_PRESETS.AVATAR, {
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      maxSizeKB: 20,
      minWidth: 50,
      minHeight: 50,
    });
  }

  static createThumbnailProcessor(): ImageProcessor {
    return new ImageProcessor(COMPRESSION_PRESETS.THUMBNAIL, {
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      maxSizeKB: 100,
      minWidth: 100,
      minHeight: 100,
    });
  }

  static createBrandingProcessor(): ImageProcessor {
    return new ImageProcessor(COMPRESSION_PRESETS.BRANDING, {
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      maxSizeKB: 300,
      minWidth: 100,
      minHeight: 100,
    });
  }

  static createGeneralProcessor(): ImageProcessor {
    return new ImageProcessor(COMPRESSION_PRESETS.GENERAL, {
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      maxSizeKB: 1024,
    });
  }
}

// Convenience functions for backward compatibility
export async function compressImage(
  file: File,
  options: CompressionOptions = COMPRESSION_PRESETS.AVATAR,
): Promise<File> {
  // Skip compression for SVG files as they are vector-based
  if (file.type === "image/svg+xml") {
    return file;
  }

  const processor = new ImageProcessor(options);
  return await processor.compressImage(file);
}

export async function validateImageFile(
  file: File,
  maxSizeKB: number = 20,
): Promise<boolean> {
  const processor = new ImageProcessor(undefined, { maxSizeKB });
  return await processor.validateFile(file);
}
