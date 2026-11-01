import { Router } from "express";
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/api/users/me/profile', verifyToken, getMyProfile);
router.patch('/api/users/me/profile', verifyToken, updateMyProfile);

export default router;