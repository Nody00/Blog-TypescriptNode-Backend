import express from "express";
import { login, signup } from "../controllers/auth.js";
import { body } from "express-validator";
const router = express.Router();

router.post(
  "/login",
  [
    body("email").trim().notEmpty().escape().isEmail(),
    body("password").trim().notEmpty().escape().isLength({ min: 7 }),
  ],
  login
);

router.post(
  "/signup",
  [
    body("email").trim().notEmpty().escape().isEmail(),
    body("password").trim().notEmpty().escape().isLength({ min: 7 }),
  ],
  signup
);

export default router;
