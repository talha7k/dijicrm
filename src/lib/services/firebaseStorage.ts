import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getBlob,
} from "firebase/storage";
import app from "$lib/firebase";

// Initialize Firebase Storage
const storage = getStorage(app);

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  path?: string; // custom path in storage
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  file: File,
  fileName: string,
  options: FileUploadOptions = {},
): Promise<UploadResult> {
  try {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
      ],
      path = "uploads",
    } = options;

    // Validate file size
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
      };
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    // Create a unique file path
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${fileName}-${timestamp}.${fileExtension}`;
    const fullPath = `${path}/${uniqueFileName}`;

    // Create storage reference
    const storageRef = ref(storage, fullPath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      path: fullPath,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error("File deletion error:", error);
    return false;
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  baseFileName: string,
  options: FileUploadOptions = {},
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName =
      files.length > 1 ? `${baseFileName}-${i + 1}` : baseFileName;
    const result = await uploadFile(file, fileName, options);
    results.push(result);
  }

  return results;
}

/**
 * Generate a signed URL for temporary access (if needed)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  try {
    // Note: Firebase Storage doesn't have built-in signed URLs like AWS S3
    // This would require a cloud function to generate signed URLs
    // For now, return the public download URL
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting signed URL:", error);
    return null;
  }
}

/**
 * Download a file as base64 string for email attachments
 */
export async function downloadFileAsBase64(
  filePath: string,
): Promise<string | null> {
  try {
    const storageRef = ref(storage, filePath);
    const blob = await getBlob(storageRef);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file as base64"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error downloading file as base64:", error);
    return null;
  }
}
