import express from "express";
import { body } from "express-validator";
import {
  addNewPost,
  deletePost,
  editPost,
  addComment,
  likePost,
  dislikePost,
  likeComment,
  dislikeComment,
  deleteComment,
  editComment,
  getAllPosts,
  getPost,
  getUserPosts,
} from "../controllers/post.js";
import { isAuth } from "../helpers/isAuth.js";
const router = express.Router();

// Get all posts
router.get("/all", getAllPosts);

// Get specific post
router.get("/:postId", getPost);

// Get posts by specific user
router.get("/userPosts/:userId", getUserPosts);

// Post a new post
router.post(
  "/new",
  isAuth,
  [body("title").notEmpty().escape(), body("content").notEmpty().escape()],
  addNewPost
);

// Delete a post
router.delete("/delete/:postId", isAuth, deletePost);

// Edit a post
router.post(
  "/edit/:postId",
  isAuth,
  [body("title").notEmpty().escape(), body("content").notEmpty().escape()],
  editPost
);

// Add a comment
router.post(
  "/comment/:postId",
  isAuth,
  [body("content").notEmpty().escape()],
  addComment
);

// Edit comment
router.post(
  "/comment/edit/:commentId",
  isAuth,
  [body("content").notEmpty().escape()],
  editComment
);

// Delete comment
router.delete("/comment/delete/:commentId", isAuth, deleteComment);

// Like a post
router.post("/like/:postId", isAuth, likePost);

// Dislike a post
router.post("/dislike/:postId", isAuth, dislikePost);

// Like a comment
router.post("/like/comment/:commentId", isAuth, likeComment);

// dislike a comment
router.post("/dislike/comment/:commentId", isAuth, dislikeComment);

export default router;
