/**
 * Auth module exports
 * Public API for authentication utilities
 */

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
