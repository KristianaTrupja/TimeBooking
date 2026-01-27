/**
 * Session Invalidation Cache
 * This prevents unnecessary DB queries for users who haven't been modified
 */
const invalidatedSessions = new Set<number>();

/**
 * Mark a user's session as needing refresh
 * Call this when admin changes user role/permissions
 */
export function invalidateUserSession(userId: number): void {
  invalidatedSessions.add(userId);
}

/**
 * Check if user's session needs refresh
 */
export function shouldRefreshSession(userId: number): boolean {
  return invalidatedSessions.has(userId);
}

/**
 * Clear the invalidation flag after refresh
 */
export function clearSessionInvalidation(userId: number): void {
  invalidatedSessions.delete(userId);
}

/**
 * Get all invalidated user IDs (for debugging)
 */
export function getInvalidatedSessions(): number[] {
  return Array.from(invalidatedSessions);
}
