export const CLOUDINARY = {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  API_KEY: process.env.CLOUDINARY_API_KEY,
  API_SECRET: process.env.CLOUDINARY_API_SECRET,
  FOLDER: process.env.CLOUDINARY_FOLDER || 'SocialMediaApp',
  DEFAULT_IMAGE:
    process.env.CLOUDINARY_DEFAULT_IMAGE ||
    'https://res.cloudinary.com/your-cloud-name/image/upload/v1616161616/default-image.png',
  DEFAULT_VIDEO:
    process.env.CLOUDINARY_DEFAULT_VIDEO ||
    'https://res.cloudinary.com/your-cloud-name/video/upload/v1616161616/default-video.mp4',
  DEFAULT_AUDIO:
    process.env.CLOUDINARY_DEFAULT_AUDIO ||
    'https://res.cloudinary.com/your-cloud-name/audio/upload/v1616161616/default-audio.mp3',
};
