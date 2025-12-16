/**
 * Media URL utility functions for constructing media URLs from relative paths.
 * All media files are stored on the server at /home/atharva/media/ and served by nginx at /media/
 */

const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_URL || window.location.origin;

/**
 * Converts a relative media path to a full URL.
 * Handles both new format (/media/...) and legacy paths (/api/chat/media/...)
 * 
 * @param {string|null|undefined} mediaPath - Relative path from media root (e.g., "/media/photos/chat/uuid.jpg")
 * @returns {string|null} - Full URL or null if path is invalid
 */
export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;

  // If already absolute URL, return as-is
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }

  // If relative path starts with /media/, use media server
  if (mediaPath.startsWith('/media/')) {
    return `${MEDIA_BASE_URL}${mediaPath}`;
  }

  // Legacy paths - migrate to /media/ format
  if (mediaPath.startsWith('/api/chat/media/')) {
    // Convert old chat media paths to new format
    const filename = mediaPath.split('/').pop();
    // Determine category from file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    let category = 'photos'; // default
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
      category = 'videos';
    } else if (ext === 'pdf') {
      category = 'pdfs';
    }
    return `${MEDIA_BASE_URL}/media/${category}/chat/${filename}`;
  }

  // Legacy static paths
  if (mediaPath.startsWith('/static/')) {
    // Convert /static/images/... to /media/photos/profile/...
    const pathParts = mediaPath.split('/');
    const filename = pathParts[pathParts.length - 1];
    return `${MEDIA_BASE_URL}/media/photos/profile/${filename}`;
  }

  // Default: assume it's a relative path from media root
  return `${MEDIA_BASE_URL}/media/${mediaPath}`;
};

/**
 * Gets profile image URL with default fallback.
 * 
 * @param {string|null|undefined} imagePath - Profile image path
 * @returns {string} - Full URL to profile image or default image
 */
export const getProfileImageUrl = (imagePath) => {
  // If no image, return default
  if (!imagePath) {
    return `${MEDIA_BASE_URL}/media/default_silhouette.png`;
  }

  // Use getMediaUrl to handle the path
  const url = getMediaUrl(imagePath);

  // If getMediaUrl returns null, fall back to default
  return url || `${MEDIA_BASE_URL}/media/default_silhouette.png`;
};

