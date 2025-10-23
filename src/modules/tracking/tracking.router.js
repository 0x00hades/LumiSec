import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { generalFields, isValid } from '../../middleware/validation.js';
import joi from 'joi';
import { trackOpen, trackClick, safePage } from './tracking.controller.js';

const router = Router();

const recipientSchema = joi.object({ recipientId: generalFields.objectId.required() });

router.get('/track/open/:recipientId', isValid(recipientSchema), asyncHandler(trackOpen));
router.get('/track/click/:recipientId', isValid(recipientSchema), asyncHandler(trackClick));
router.get('/safe_page', safePage);

export default router;


