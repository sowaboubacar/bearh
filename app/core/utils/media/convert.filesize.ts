
/**
 * Convert file size to human readable format
 * 
 * This function takes a file size in bytes and returns a human-readable string with the size in the appropriate unit (B, KB, MB, GB, TB).
 * 
 * @param size - The file size in bytes
 * @returns The file size in human-readable format
 */
export function convertFileSize(size: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

