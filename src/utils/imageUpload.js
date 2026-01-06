import FormData from 'form-data';
import fetch from 'node-fetch';

// Image upload utility using imgBB API (for server-side if needed)
export const uploadImage = async (imageBuffer, filename) => {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, filename);
    formData.append('key', process.env.IMGBB_API_KEY);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'Image upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};
