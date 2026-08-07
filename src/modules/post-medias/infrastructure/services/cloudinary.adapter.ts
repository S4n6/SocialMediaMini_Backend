/**
 * @deprecated
 * This adapter is no longer needed — StorageModule now provides IStorageService
 * directly via the STORAGE_SERVICE token.
 *
 * postMedias.module.ts wires CLOUDINARY_SERVICE → STORAGE_SERVICE so all
 * existing use-cases continue to work without changes.
 *
 * This file is kept for reference only and can be deleted once all use-cases
 * are updated to inject STORAGE_SERVICE instead of CLOUDINARY_SERVICE.
 */
export {};
