/**
 * Services module exports
 * Public API for business logic services
 */

// Post service
export {
  createPost,
  fetchPublishedPosts,
  userCanCreatePosts,
  getUserPostStats,
} from "./postService";
export type { PostCreationResult } from "./postService";

// Comment service
export {
  createComment,
  getApprovedCommentsByPost,
  getAllCommentsByPost,
  getUnapprovedComments,
  approveComment,
  rejectComment,
  deleteComment,
  getUserComments,
  getCommentStats,
} from "./commentService";
export type { Comment, CommentResponse } from "./commentService";
