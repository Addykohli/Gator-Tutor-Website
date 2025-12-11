/**
 * Authentication helper functions for role-based access control
 */

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null if not logged in
 */
export const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      
      // Normalize user object to ensure consistent access
      // Spread user first, then override with normalized values
      return {
        ...user,
        user_id: user.user_id || user.id || null,
        role: user.role ? user.role.toLowerCase() : null,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        sfsu_email: user.sfsu_email || user.email || ''
      };
    } catch (err) {
      console.error('Error parsing user data:', err);
      return null;
    }
  };
  
  /**
   * Check if user has one of the required roles
   * @param {string[]} requiredRoles - Array of allowed roles (e.g., ['admin'], ['student', 'tutor'])
   * @returns {boolean} True if user has one of the required roles
   */
  export const hasRequiredRole = (requiredRoles) => {
    const user = getCurrentUser();
    if (!user || !user.role) return false;
    
    return requiredRoles.includes(user.role);
  };
  
  /**
   * Check if user is an admin
   * @returns {boolean} True if user is an admin
   */
  export const isAdmin = () => {
    return hasRequiredRole(['admin', 'administrator']);
  };
  
  /**
   * Check if user is a student
   * @returns {boolean} True if user is a student
   */
  export const isStudent = () => {
    return hasRequiredRole(['student']);
  };
  
  /**
   * Check if user is a tutor
   * @returns {boolean} True if user is a tutor
   */
  export const isTutor = () => {
    return hasRequiredRole(['tutor']);
  };
  
  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in
   */
  export const isLoggedIn = () => {
    return getCurrentUser() !== null;
  };
  