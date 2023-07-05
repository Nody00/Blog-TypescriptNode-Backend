import { RequestHandler } from "express";
import postModel from "../models/postModel.js";
import userModel from "../models/userModel.js";
import commentModel from "../models/commentModel.js";
import { Schema } from "mongoose";
import { validationResult } from "express-validator";

interface Error {
  message: string;
  statusCode: number;
}

// interface IPost {
//   _id: Schema.Types.ObjectId;
//   title: string;
//   content: string;
//   likes: number;
//   dislikes: number;
//   favourites: number;
//   author: Schema.Types.ObjectId;
//   images: string[];
//   comments: Schema.Types.ObjectId[];
// }

export const getAllPosts: RequestHandler = (req, res, next) => {
  postModel
    .find()
    .then((result) => {
      if (!result) {
        const error: Error = {
          statusCode: 404,
          message: "Could not fetch posts",
        };
        throw error;
      }

      res.status(200).json({ message: "Posts fetched", posts: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const getPost: RequestHandler = (req, res, next) => {
  const postId = req.params.postId;
  postModel
    .findById(postId)
    .then((result) => {
      if (!result) {
        const error: Error = {
          statusCode: 404,
          message: "Could not fetch post",
        };
        throw error;
      }

      res.status(200).json({ message: "Post fetched", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const getUserPosts: RequestHandler = (req, res, next) => {
  const userId = req.params.userId;
  postModel
    .find({ author: userId })
    .then((result) => {
      if (!result) {
        const error: Error = {
          statusCode: 404,
          message: "Could not fetch posts",
        };
        throw error;
      }

      res.status(200).json({ message: "Posts fetched", posts: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const addNewPost: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  const title = req.body.title;
  const content = req.body.content;
  const images = req.body.images;
  const userId = req.body.userId;
  let authorEmail;

  const user = await userModel.findById(userId);

  if (!user) {
    const error: Error = {
      message: "User does not exist",
      statusCode: 406,
    };
    throw error;
  }

  authorEmail = user.email;

  const newPost = new postModel({
    title: title,
    content: content,
    images: images,
    author: userId,
    likes: 0,
    dislikes: 0,
    favourites: 0,
    authorEmail: authorEmail,
  });
  let savedPost: any;
  newPost
    .save()
    .then((result) => {
      savedPost = result;
      return userModel.findById(userId);
    })
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "User does not exist",
          statusCode: 406,
        };
        throw error;
      }
      user.posts.push(savedPost._id);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const deletePost: RequestHandler = (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.body.userId;

  postModel
    .findOneAndDelete({ author: userId, _id: postId })
    .then((result) => {
      return userModel.findById(userId);
    })
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "User does not exist",
          statusCode: 406,
        };
        throw error;
      }
      const existingItemIndex = user.posts.findIndex(
        (e) => e._id.toString() === postId
      );

      if (existingItemIndex === -1) {
        const error: Error = {
          message: "No such post is associated with this user",
          statusCode: 404,
        };
        throw error;
      }

      user.posts.splice(existingItemIndex, 1);

      return user.save();
    })
    .then((result) => {
      res
        .status(200)
        .json({ message: "Post deleted successfully", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const editPost: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  const postId = req.params.postId;
  const userId = req.body.userId;
  const title = req.body.title;
  const content = req.body.content;
  const images = req.body.images;

  postModel
    .findOne({ _id: postId, author: userId })
    .then((post) => {
      if (!post) {
        const error: Error = {
          message: "No such post",
          statusCode: 404,
        };
        throw error;
      }

      // edit post
      post.title = title;
      post.content = content;
      post.images = images;

      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post edited!", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const addComment: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  const postId = req.params.postId;
  const userId = req.body.userId;
  const content = req.body.content;

  // add new comment
  const newComment = new commentModel({
    author: userId,
    post: postId,
    content: content,
    likes: 0,
    dislikes: 0,
  });

  newComment
    .save()
    .then((result) => {
      return postModel.findOne({ _id: postId, author: userId });
    })
    .then((post) => {
      if (!post) {
        const error: Error = {
          message: "No such post",
          statusCode: 404,
        };
        throw error;
      }

      post.comments.push(newComment._id);
      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Comment added", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const deleteComment: RequestHandler = (req, res, next) => {
  const commentId = req.params.commentId;
  const userId = req.body.userId;

  commentModel
    .findOneAndDelete({ _id: commentId, author: userId })
    .then((result) => {
      res.status(200).json({ message: "Comment deleted", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const editComment: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  const commentId = req.params.commentId;
  const userId = req.body.userId;
  const newContent = req.body.content;

  commentModel
    .findOneAndUpdate(
      { _id: commentId, author: userId },
      { content: newContent }
    )
    .then((result) => {
      res.status(200).json({ message: "Comment updated" });
    })
    .catch((err) => {
      console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const likePost: RequestHandler = (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.body.userId;
  let loadedPost: any;
  postModel
    .findOne({ _id: postId })
    .then((post) => {
      if (!post) {
        const error: Error = {
          message: "No such post",
          statusCode: 404,
        };
        throw error;
      }

      loadedPost = post;
      return post.save();
    })
    .then((result) => {
      return userModel.findOne({ _id: userId });
    })
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "User does not exist",
          statusCode: 406,
        };
        throw error;
      }

      // post already disliked
      const existingDislikedPostIndex = user.dislikedPosts.findIndex(
        (e) => e.toString() === loadedPost._id.toString()
      );

      // post already liked
      const existinglikedPostIndex: number = user.likedPosts.findIndex(
        (e) => e.toString() === loadedPost._id.toString()
      );

      if (existingDislikedPostIndex !== -1) {
        user.dislikedPosts.splice(existingDislikedPostIndex, 1);
        loadedPost.dislikes =
          loadedPost.dislikes === 0 ? 0 : loadedPost.dislikes - 1;
      }

      if (existinglikedPostIndex !== -1) {
        user.likedPosts.splice(existinglikedPostIndex, 1);
        loadedPost.likes = loadedPost.likes === 0 ? 0 : loadedPost.likes - 1;
        return user.save();
      }

      user.likedPosts.push(loadedPost._id);
      loadedPost.likes = loadedPost.likes + 1;
      return user.save();
    })
    .then((userSaved) => {
      return loadedPost.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post liked", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const dislikePost: RequestHandler = (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.body.userId;
  let loadedPost: any;
  postModel
    .findOne({ _id: postId })
    .then((post) => {
      if (!post) {
        const error: Error = {
          message: "No such post",
          statusCode: 404,
        };
        throw error;
      }

      loadedPost = post;
      return post.save();
    })
    .then((result) => {
      return userModel.findOne({ _id: userId });
    })
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "User does not exist",
          statusCode: 406,
        };
        throw error;
      }

      // post already disliked
      const existingDislikedPostIndex: number = user.dislikedPosts.findIndex(
        (e) => e.toString() === loadedPost._id.toString()
      );

      // post already liked
      const existinglikedPostIndex: number = user.likedPosts.findIndex(
        (e) => e.toString() === loadedPost._id.toString()
      );

      if (existingDislikedPostIndex !== -1) {
        user.dislikedPosts.splice(existingDislikedPostIndex, 1);
        loadedPost.dislikes =
          loadedPost.dislikes === 0 ? 0 : loadedPost.dislikes - 1;
        return user.save();
      }

      if (existinglikedPostIndex !== -1) {
        user.likedPosts.splice(existinglikedPostIndex, 1);
        loadedPost.likes = loadedPost.likes === 0 ? 0 : loadedPost.likes - 1;
      }

      user.dislikedPosts.push(loadedPost._id);
      loadedPost.dislikes = loadedPost.dislikes + 1;
      return user.save();
    })
    .then((result) => {
      return loadedPost.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post disliked", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const likeComment: RequestHandler = (req, res, next) => {
  const commentId = req.params.commentId;
  const userId = req.body.userId;
  let loadedComment: any;
  commentModel
    .findOne({ _id: commentId })
    .then((comment) => {
      if (!comment) {
        const error: Error = {
          message: "No such comment",
          statusCode: 404,
        };
        throw error;
      }

      loadedComment = comment;
      return comment.save();
    })
    .then((result) => {
      return userModel.findOne({ _id: userId });
    })
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "User does not exist",
          statusCode: 406,
        };
        throw error;
      }

      // comment already disliked
      const existingDislikedCommentIndex = user.dislikedComments.findIndex(
        (e) => e.toString() === loadedComment._id.toString()
      );

      // post already liked
      const existinglikedCommentIndex: number = user.likedComments.findIndex(
        (e) => e.toString() === loadedComment._id.toString()
      );

      if (existingDislikedCommentIndex !== -1) {
        user.dislikedComments.splice(existingDislikedCommentIndex, 1);
        loadedComment.dislikes =
          loadedComment.dislikes === 0 ? 0 : loadedComment.dislikes - 1;
      }

      if (existinglikedCommentIndex !== -1) {
        user.likedComments.splice(existinglikedCommentIndex, 1);
        loadedComment.likes =
          loadedComment.likes === 0 ? 0 : loadedComment.likes - 1;
        return user.save();
      }

      user.likedComments.push(loadedComment._id);
      loadedComment.likes = loadedComment.likes + 1;
      return user.save();
    })
    .then((userSaved) => {
      return loadedComment.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Comment liked", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

export const dislikeComment: RequestHandler = (req, res, next) => {
  const commentId = req.params.commentId;
  const userId = req.body.userId;
  let loadedComment: any;
  commentModel
    .findOne({ _id: commentId })
    .then((comment) => {
      if (!comment) {
        const error: Error = {
          message: "No such comment",
          statusCode: 404,
        };
        throw error;
      }

      loadedComment = comment;
      return comment.save();
    })
    .then((result) => {
      return userModel.findOne({ _id: userId });
    })
    .then((user) => {
      if (!user) {
        const error: Error = {
          message: "User does not exist",
          statusCode: 406,
        };
        throw error;
      }

      // post already disliked
      const existingDislikedCommentIndex: number =
        user.dislikedComments.findIndex(
          (e) => e.toString() === loadedComment._id.toString()
        );

      // post already liked
      const existinglikedCommentIndex: number = user.likedComments.findIndex(
        (e) => e.toString() === loadedComment._id.toString()
      );

      if (existingDislikedCommentIndex !== -1) {
        user.dislikedComments.splice(existingDislikedCommentIndex, 1);
        loadedComment.dislikes =
          loadedComment.dislikes === 0 ? 0 : loadedComment.dislikes - 1;
        return user.save();
      }

      if (existinglikedCommentIndex !== -1) {
        user.likedComments.splice(existinglikedCommentIndex, 1);
        loadedComment.likes =
          loadedComment.likes === 0 ? 0 : loadedComment.likes - 1;
      }

      user.dislikedComments.push(loadedComment._id);
      loadedComment.dislikes = loadedComment.dislikes + 1;
      return user.save();
    })
    .then((result) => {
      return loadedComment.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post disliked", result: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
