import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { isValid, generalFields } from '../../middleware/validation.js';
import { createCampaign, uploadRecipients, metrics, exportEvents } from './campaigns.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const createCampaignSchema = (await import('joi')).default.object({
  name: generalFields.name.required(),
  template: (await import('joi')).default.string().required(),
});

const campaignIdSchema = (await import('joi')).default.object({
  campaignId: generalFields.objectId.required(),
});

router.post('/create', isValid(createCampaignSchema), asyncHandler(createCampaign));
router.post('/:campaignId/upload_recipients', isValid(campaignIdSchema), upload.single('file'), asyncHandler(uploadRecipients));
router.get('/:campaignId/metrics', isValid(campaignIdSchema), asyncHandler(metrics));
router.get('/:campaignId/events/export', isValid(campaignIdSchema), asyncHandler(exportEvents));

export default router;


