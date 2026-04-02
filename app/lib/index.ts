/**
 * Main lib module exports
 * Centralized public API for all utilities
 */

// Database
export { supabase } from "./database";
export type { User, Post, Comment } from "./database";

// Authentication
export {
  getValidToken,
  getCurrentUser,
  getCurrentUserProfile,
  login,
  register,
  logout,
  checkRole,
  isAuthor,
  isAdmin,
} from "./auth";

// Services
export {
  createPost,
  fetchPublishedPosts,
  userCanCreatePosts,
  getUserPostStats,
  createComment,
  getApprovedCommentsByPost,
  getAllCommentsByPost,
  getUnapprovedComments,
  approveComment,
  rejectComment,
  deleteComment,
  getUserComments,
  getCommentStats,
} from "./services";
export type { PostCreationResult, Comment as CommentType, CommentResponse } from "./services";

// Validators
export {
  POST_VALIDATION,
  validateCreatePostInput,
  sanitizeInput,
  validatePaginationParams,
  estimateReadingTime,
  getContentStats,
  COMMENT_VALIDATION,
  validateCreateCommentInput,
  validateCommentId,
  sanitizeCommentText,
  getCommentStats as getCommentTextStats,
} from "./validators";
export type { CreatePostInput, CreatePostValidated, CreateCommentInput, CreateCommentValidated } from "./validators";

// AI
export {
  generateSummary,
  generateMultipleSummaries,
  canGenerateSummary,
  getRemainingCalls,
  resetRateLimit,
  getAICallStats,
  logAICall,
  getAIMetrics,
  estimateCost,
  getMetricsByUser,
  clearOldMetrics,
} from "./ai";
export type { GenerateContentRequest, AICallMetrics } from "./ai";

// Middleware
export {
  verifyAuth,
  verifyRole,
  successResponse,
  errorResponse,
} from  "./middleware";

// Security
export {
  sanitizeHtml,
  sanitizeText,
  isValidUrl,
  isValidEmail,
  validateInputLength,
  sanitizeObject,
  detectSuspiciousInput,
} from "./security/sanitization";

export {
  addSecurityHeaders,
  validateCSRFToken,
  RateLimiter,
  getClientIp,
  isValidOrigin,
  logSecurityEvent,
} from "./security/headers";
