import { RequestHandler } from "express";
import { Error } from "../index.js";
import { validationResult } from "express-validator/src/validation-result.js";
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  // reach out to db find the user check the passwords and return token
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser: any;

  userModel
    .findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "No such user found",
          statusCode: 404,
        };
        throw error;
      }

      // user exists compare passwords
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error: Error = {
          message: "Passwords do not match",
          statusCode: 406,
        };
        throw error;
      }

      // passwords match create token and send it to the user
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "supersecretkey",
        {
          expiresIn: "3h",
        }
      );

      res.status(200).json({
        token: token,
        userId: loadedUser._id.toString(),
        email: loadedUser.email,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const signup: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  const email = req.body.email;
  const password = req.body.password;

  // see if user already exists

  userModel
    .findOne({ email: email })
    .then((user) => {
      if (user) {
        const error: Error = {
          message: "User already exists",
          statusCode: 406,
        };
        throw error;
      }

      return bcrypt.hash(password, 12);
    })
    .then((hashedPass) => {
      const newUser = new userModel({
        email: email,
        password: hashedPass,
      });

      return newUser.save();
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ message: "User created!", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
