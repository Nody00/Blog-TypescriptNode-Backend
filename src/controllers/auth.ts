import { RequestHandler } from "express";
import { Error } from "../index.js";
import { validationResult } from "express-validator/src/validation-result.js";
import userModel from "../models/userModel.js";
import commentModel from "../models/commentModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import postModel from "../models/postModel.js";

export const login: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  // reach out to db find the user check the passwords and return token
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      const error: Error = {
        message: "No such user found",
        statusCode: 404,
      };
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error: Error = {
        message: "Passwords do not match",
        statusCode: 406,
      };
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      process.env.SECRET_KEY || "supersecretkey",
      {
        expiresIn: "3h",
      }
    );

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 3);

    res.status(200).json({
      token: token,
      userId: user._id.toString(),
      email: user.email,
      expirationDate: expirationDate,
      username: user.username,
    });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const signup: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  const email = req.body.email;
  const password = req.body.password;
  const username = req.body.username;

  // see if user already exists

  try {
    const userWithEmail = await userModel.findOne({ email: email });
    if (userWithEmail) {
      const error: Error = {
        message: "Email already in use",
        statusCode: 406,
      };
      throw error;
    }

    const userWithUsername = await userModel.findOne({ username: username });
    if (userWithUsername) {
      const error: Error = {
        message: "Username already in use",
        statusCode: 406,
      };
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new userModel({
      email: email,
      password: hashedPassword,
      username: username,
    });
    await newUser.save();
    res.status(200).json({ message: "User created!" });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const deleteProfile: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed",
      errors: errors.array(),
      error: true,
      errorMessage: "Password invalid",
    });
  }

  const userId = req.params.userId;
  const password = req.body.password;

  // delete profile
  // delete comments
  // delete posts
  let loadedUser: any;
  let loadedComments: any;
  let loadedPosts: any;

  userModel
    .findById(userId)
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "No such user exists",
          statusCode: 404,
        };
        throw error;
      }

      loadedUser = user;

      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error: Error = {
          message: "Wrong password",
          statusCode: 403,
        };
        throw error;
      }

      return commentModel.find({ author: loadedUser.email });
    })
    .then((comments) => {
      loadedComments = comments;

      return postModel.find({ author: userId });
    })
    .then((posts) => {
      loadedPosts = posts;

      return loadedUser.deleteOne();
    })
    .then((result) => {
      loadedComments.forEach((comment: any) => comment.deleteOne());
      loadedPosts.forEach((post: any) => post.deleteOne());

      res.status(200).json({ result: "Profile data deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const changeEmail: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Validation failed",
        errors: errors.array(),
        error: true,
        errorMessage: "Email or password invalid",
      });
    }

    const userId = req.params.userId;
    const newEmail = req.body.email;
    const password = req.body.password;

    console.log(userId, newEmail, password);

    const user = await userModel.findById(userId);
    if (!user) {
      const error: Error = {
        message: "No such user exists",
        statusCode: 404,
      };
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error: Error = {
        message: "Wrong password",
        statusCode: 403,
      };
      throw error;
    }

    if (user.email === newEmail) {
      const error: Error = {
        message: "Same Email",
        statusCode: 400,
      };
      throw error;
    }

    user.email = newEmail;

    const result = await user.save();

    res.status(200).json({ message: "Email changed", result: result });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Validation failed",
        errors: errors.array(),
        error: true,
        errorMessage: "Password may be invalid",
      });
    }

    const userId = req.params.userId;
    const newPassword = req.body.newPassword;
    const password = req.body.password;

    const user = await userModel.findById(userId);
    if (!user) {
      const error: Error = {
        message: "No such user exists",
        statusCode: 404,
      };
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error: Error = {
        message: "Wrong password",
        statusCode: 403,
      };
      throw error;
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = newHashedPassword;

    const result = await user.save();

    res.status(200).json({ message: "Password changed", result: result });
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
