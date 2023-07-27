import { RequestHandler } from "express";
import { Error } from "../index.js";
import { validationResult } from "express-validator/src/validation-result.js";
import chatModel from "../models/chatModel.js";
import messageModel from "../models/messageModel.js";
import userModel from "../models/userModel.js";

export const createNewChat: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  try {
    const userEmail1 = req.body.userEmail1;
    const userEmail2 = req.body.userEmail2;

    const existingChat = await chatModel.findOne({
      $and: [
        { partisipantEmails: userEmail1 },
        { partisipantEmails: userEmail2 },
      ],
    });

    // console.log(existingChat);

    if (existingChat) {
      const error: Error = {
        message: "You already have a chat with that user!",
        statusCode: 404,
      };
      throw error;
    }

    const user1: any = await userModel.find({ email: userEmail1 });
    const user2: any = await userModel.find({ email: userEmail2 });

    if (!user1 || !user2) {
      const error: Error = {
        message: "No such user!",
        statusCode: 404,
      };
      throw error;
    }

    const newChat = new chatModel({
      partisipantEmails: [userEmail1, userEmail2],
      partisipantUsernames: [user1[0].username, user2[0].username],
      messages: [],
    });
    const result = await newChat.save();

    user1[0].chats.push(result._id);
    user2[0].chats.push(result._id);

    await user1[0].save();
    await user2[0].save();

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
    const result = await chatModel.findById(chatId);

    if (!result) {
      const error: Error = {
        message: "No such chat exists",
        statusCode: 404,
      };
      throw error;
    }

    const user1 = await userModel.findOne({
      email: result?.partisipantEmails[0],
    });
    const user2 = await userModel.findOne({
      email: result?.partisipantEmails[1],
    });

    if (!user1 || !user2) {
      const error: Error = {
        message: "No such user!",
        statusCode: 404,
      };
      throw error;
    }

    const chatIndex1 = user1.chats.findIndex(
      (e) => e._id.toString() === chatId
    );
    const chatIndex2 = user2.chats.findIndex(
      (e) => e._id.toString() === chatId
    );

    if (chatIndex1 === -1 || chatIndex2 === -1) {
      const error: Error = {
        message: "Chat does not exist in user model!",
        statusCode: 404,
      };
      throw error;
    }

    user1.chats.splice(chatIndex1, 1);
    user2.chats.splice(chatIndex2, 1);

    await user1.save();
    await user2.save();
    await result.deleteOne();

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

    res.status(200).json({ result: savedMessage });
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

    const user = await userModel.findById(userId).populate("chats");

    if (!user) {
      const error: Error = {
        message: "No such user!",
        statusCode: 404,
      };
      throw error;
    }

    res.status(200).json({ result: user.chats });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
