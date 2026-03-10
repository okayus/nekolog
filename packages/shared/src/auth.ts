/**
 * Authentication Domain Types
 *
 * Branded ID types and algebraic data types for type-safe authentication.
 * Prevents accidental misuse of IDs across domain boundaries.
 */

// Branded ID types (unique symbol prevents catId/userId confusion at compile time)
declare const userIdBrand: unique symbol;
declare const sessionIdBrand: unique symbol;

export type UserId = string & { readonly [userIdBrand]: never };
export type SessionId = string & { readonly [sessionIdBrand]: never };

// Factory functions (runtime conversion with branded types)
export const toUserId = (value: string): UserId => value as UserId;
export const toSessionId = (value: string): SessionId => value as SessionId;

/**
 * Algebraic data type for frontend authentication state.
 * Replaces boolean `isSignedIn` with exhaustive pattern matching.
 */
export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: UserId; email: string }
  | { status: "error"; message: string };
