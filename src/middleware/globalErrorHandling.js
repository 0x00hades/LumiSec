import { deleteCloudImage } from '../utils/cloud.js';
import { deleteFile } from '../utils/file.js';

async function globalErrorHandling(err, req, res, next) {
  try {
    if (req.file && req.file.path) {
      deleteFile(req.file.path);
    }
    if (req.failImage?.public_id) {
      await deleteCloudImage(req.failImage.public_id);
    }
    if (Array.isArray(req.failImages) && req.failImages.length > 0) {
      for (const public_id of req.failImages) {
        await deleteCloudImage(public_id);
      }
    }
  } catch (_) {}

  return res
    .status(err.statusCode || 500)
    .json({ message: err.message || 'Internal Server Error', success: false });
}

export { globalErrorHandling };


