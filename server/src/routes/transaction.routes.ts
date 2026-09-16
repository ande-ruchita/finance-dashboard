import { Router } from "express";
import { getTransactions, exportTransactions, getSummary } from "../controllers/transaction.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", verifyToken, getTransactions);
router.get("/summary", verifyToken, getSummary);
router.post("/export", verifyToken, exportTransactions);

export default router;