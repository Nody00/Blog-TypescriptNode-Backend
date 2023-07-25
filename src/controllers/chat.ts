import { RequestHandler } from "express";
import { Error } from "../index.js";
import { validationResult } from "express-validator/src/validation-result.js";
import chatModel from "../models/chatModel.js";
import messageModel from "../models/messageModel.js";

export const createNewChat: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const userId1 = req.body.userId1;
    const userId2 = req.body.userId2;

    const newChat = new chatModel({
      participants: [userId1, userId2],
      messages: [],
    });

    const result = await newChat.save();

    res.status(200).json({ message: "New chat created" });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const deleteChat: RequestHandler = async (req, res, next) => {
  const chatId = req.params.chatId;

  try {
    const result = await chatModel.findByIdAndDelete(chatId);

    res.status(200).json({ message: "Chat Deleted" });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const addNewMessage: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const userId = req.body.userId;
    const message = req.body.message;
    const chatId = req.body.chatId;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
      const error: Error = {
        message: "No such chat found!",
        statusCode: 404,
      };
      throw error;
    }

    const newMessage = new messageModel({
      author: userId,
      createdDate: new Date(),
      text: message,
    });

    const savedMessage: any = await newMessage.save();

    chat.messages.push(savedMessage);

    const result = await chat.save();

    res.status(200).json({ message: "Message added!" });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const deleteMessage: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const messageId = req.body.messageId;
    const chatId = req.body.chatId;

    const chat = await chatModel.findById(chatId);
    if (!chat) {
      const error: Error = {
        message: "No such chat found!",
        statusCode: 404,
      };
      throw error;
    }

    const existingMessageIndex = chat.messages.findIndex(
      (e: any) => e.toString() === messageId
    );

    if (existingMessageIndex === -1) {
      const error: Error = {
        message: "No such message found!",
        statusCode: 404,
      };
      throw error;
    }

    chat.messages.splice(existingMessageIndex, 1);
    await chat.save();
    await messageModel.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted!" });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const getChat: RequestHandler = async (req, res, next) => {
  const chatId = req.params.chatId;
  try {
    const chat = await chatModel.findById(chatId).populate("messages");
    if (!chat) {
      const error: Error = {
        message: "No such chat found!",
        statusCode: 500,
      };
      throw error;
    }

    res.status(200).json({ result: chat });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const getAllChats: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const userId = req.body.userId;

    const userChats = await chatModel
      .find({
        participants: userId,
      })
      .populate("messages");

    if (!userChats) {
      const error: Error = {
        message: "No chats found!",
        statusCode: 500,
      };
      throw error;
    }

    res.status(200).json({ result: userChats });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
