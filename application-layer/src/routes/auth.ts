import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/auth";

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/logout', logoutUser);

export default router;