import campaignsRouter from './campaigns/campaigns.router.js';
import trackingRouter from './tracking/tracking.router.js';

import express from 'express';
const router = express.Router();

// use routers
router.use('/campaigns', campaignsRouter);
router.use('/track', trackingRouter);

export { router as apiRouter };
