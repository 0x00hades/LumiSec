import { Router } from 'express';
import campaignsRouter from './campaigns/campaigns.router.js';
import trackingRouter from './tracking/tracking.router.js';

const apiRouter = Router();

apiRouter.use('/campaigns', campaignsRouter);
apiRouter.use('/', trackingRouter);

export { apiRouter };


