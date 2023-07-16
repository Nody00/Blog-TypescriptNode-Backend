import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface Error {
  message: string;
  statusCode: number;
}

export const isAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    const error: Error = {
      statusCode: 401,
      message: "Not auth header found!",
    };

    throw error;
  }

  const token: string = req.get("Authorization")!.split(" ")[1];

  if (!token) {
    const error: Error = {
      statusCode: 401,
      message: "Not token found!",
    };

    throw error;
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      token,
      process.env.SECRET_KEY || "supersecretkey"
    );
  } catch (err) {
    throw err;
  }

  if (!decodedToken) {
    const error: Error = {
      statusCode: 401,
      message: "Not authenticated!",
    };

    throw error;
  }

  next();
};
