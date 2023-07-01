import express from "express";
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
} from "../controllers/post.js";
const router = express.Router();

//   do some validation
//  make sure to check for auth on all appropirate routes

// Get all posts
router.get("/all");

// Get specific post
router.get("/:postId");

// Get posts by specific user
router.get("/:userId");

// Post a new post
router.post("/new", addNewPost);

// Delete a post
router.delete("/delete/:postId", deletePost);

// Edit a post
router.post("/edit/:postId", editPost);

// Add a comment
router.post("/comment/:postId", addComment);

// Edit comment
router.post("/comment/edit/:commentId", editComment);

// Delete comment
router.delete("/comment/delete/:commentId", deleteComment);

// Like a post
router.post("/like/:postId", likePost);

// Dislike a post
router.post("/dislike/:postId", dislikePost);

// Like a comment
router.post("/like/comment/:commentId", likeComment);

// dislike a comment
router.post("/dislike/comment/:commentId", dislikeComment);

export default router;
