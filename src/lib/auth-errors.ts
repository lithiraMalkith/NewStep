/**
 * Firebase Auth error message mapper and sanitizer.
 * Converts technical Firebase error codes and raw exceptions into clean, human-friendly messages.
 * Prevents raw strings like "Firebase: Error (auth/invalid-credential)." from leaking to the UI.
 */

export function getFriendlyAuthErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (!error) return fallbackMessage

  const err = error as { code?: string; message?: string }
  const code = (err.code || '').toLowerCase()
  const rawMessage = typeof err.message === 'string' ? err.message : (typeof error === 'string' ? error : '')

  // 1. Direct code lookup
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.'

    case 'auth/invalid-email':
      return 'Please enter a valid email address.'

    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.'

    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with letters and numbers.'

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact New Step support for assistance.'

    case 'auth/too-many-requests':
      return 'Too many failed sign-in attempts. For your security, this account is temporarily locked. Please wait a few minutes or reset your password.'

    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.'

    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completion. Please try again.'

    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt was initiated. Please complete or try again.'

    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'

    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign in again to continue.'

    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled. Please contact support.'

    case 'auth/expired-action-code':
      return 'This reset link has expired. Please request a new password reset email.'

    case 'auth/invalid-action-code':
      return 'This reset link is invalid or has already been used.'

    case 'auth/internal-error':
      return 'An internal service error occurred. Please try again shortly.'
  }

  // 2. Substring matching in rawMessage
  const lowerMsg = rawMessage.toLowerCase()
  if (
    lowerMsg.includes('auth/invalid-credential') ||
    lowerMsg.includes('invalid-credential') ||
    lowerMsg.includes('auth/wrong-password') ||
    lowerMsg.includes('wrong-password') ||
    lowerMsg.includes('auth/user-not-found') ||
    lowerMsg.includes('user-not-found')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }

  if (lowerMsg.includes('auth/email-already-in-use') || lowerMsg.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.'
  }

  if (lowerMsg.includes('auth/too-many-requests') || lowerMsg.includes('too-many-requests')) {
    return 'Too many failed sign-in attempts. For your security, this account is temporarily locked. Please wait a few minutes or reset your password.'
  }

  if (lowerMsg.includes('auth/network-request-failed') || lowerMsg.includes('network-request-failed')) {
    return 'Network connection error. Please check your internet connection and try again.'
  }

  if (lowerMsg.includes('auth/popup-closed-by-user') || lowerMsg.includes('popup-closed-by-user')) {
    return 'Sign-in window was closed before completion. Please try again.'
  }

  if (lowerMsg.includes('auth/popup-blocked') || lowerMsg.includes('popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
  }

  if (lowerMsg.includes('auth/invalid-email') || lowerMsg.includes('invalid-email')) {
    return 'Please enter a valid email address.'
  }

  if (lowerMsg.includes('auth/weak-password') || lowerMsg.includes('weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.'
  }

  if (lowerMsg.includes('auth/user-disabled') || lowerMsg.includes('user-disabled')) {
    return 'This account has been disabled. Please contact support.'
  }

  // 3. Strip any residual Firebase technical jargon
  if (rawMessage.includes('Firebase:') || rawMessage.includes('(auth/')) {
    const sanitized = rawMessage
      .replace(/Firebase:\s*/gi, '')
      .replace(/Error\s*\([^)]*\)\.?/gi, '')
      .replace(/\(auth\/[^)]*\)\.?/gi, '')
      .trim()
    return sanitized.length > 5 ? sanitized : fallbackMessage
  }

  return rawMessage || fallbackMessage
}
