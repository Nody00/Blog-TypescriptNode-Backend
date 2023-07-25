import express from "express";
import { body } from "express-validator";
import { isAuth } from "../helpers/isAuth.js";
import {
  createNewChat,
  deleteChat,
  addNewMessage,
  deleteMessage,
  getChat,
  getAllChats,
} from "../controllers/chat.js";
const router = express.Router();

// route for creating a chat
router.post(
  "/newChat",
  isAuth,
  [
    body("userId1").notEmpty().escape().trim(),
    body("userId2").notEmpty().escape().trim(),
  ],
  createNewChat
);

// route for deleting a chat
router.post("/deleteChat/:chatId", isAuth, deleteChat);

// route for adding a message
router.post(
  "/newMessage",
  isAuth,
  [
    body("userId").notEmpty().escape().trim(),
    body("message").notEmpty().escape().trim(),
    body("chatId").notEmpty().escape().trim(),
  ],
  addNewMessage
);

// route for deleting a message
router.post(
  "/deleteMessage",
  isAuth,
  [
    body("messageId").notEmpty().escape().trim(),
    body("chatId").notEmpty().escape().trim(),
  ],
  deleteMessage
);

// route for getting a chat
router.post("/getChat/:chatId", isAuth, getChat);

export default router;

// route for getting all chats
router.post(
  "/getAllChats",
  isAuth,
  [body("userId").notEmpty().escape().trim()],
  getAllChats
);
