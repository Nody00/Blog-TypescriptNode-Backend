import express, { Request, Response, NextFunction } from "express";
import authRouter from "./routes/auth.js";
import postRouter from "./routes/post.js";
import bodyParser from "body-parser";
import mongoose from "mongoose";

export interface Error {
  message: string;
  statusCode: number;
}

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

app.use("/auth", authRouter);
app.use("/post", postRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: true, errorObject: err });
});

mongoose
  .connect(
    "mongodb+srv://dinokrcic2077:cSzJILiPQ8usDHAc@cluster0.c6rbyhf.mongodb.net/?retryWrites=true&w=majority"
  )
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });