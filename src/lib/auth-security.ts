// Client-side authentication rate limiting and validation utilities
'use client'

// Client-side rate limiting for authentication attempts
export class AuthRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()
  private maxAttempts = 5
  private windowMs = 15 * 60 * 1000 // 15 minutes

  isBlocked(identifier: string): boolean {
    const now = Date.now()
    const entry = this.attempts.get(identifier)
    
    if (!entry) return false
    if (now > entry.resetTime) {
      this.attempts.delete(identifier)
      return false
    }
    
    return entry.count >= this.maxAttempts
  }

  recordAttempt(identifier: string): boolean {
    const now = Date.now()
    const entry = this.attempts.get(identifier)

    if (!entry || now > entry.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return false
    }

    entry.count++
    return entry.count > this.maxAttempts
  }

  getResetTime(identifier: string): number {
    const entry = this.attempts.get(identifier)
    if (!entry) return 0
    
    const remaining = Math.max(0, entry.resetTime - Date.now())
    return Math.ceil(remaining / 1000)
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }

  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - entry.count)
  }
}

// Input validation utilities
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.trim()) return 'Email is required'
  if (!emailRegex.test(email)) return 'Please enter a valid email address'
  if (email.length > 255) return 'Email is too long'
  // Check for suspicious patterns
  if (/<script|javascript:|data:/i.test(email)) return 'Invalid email format'
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 128) return 'Password is too long'
  
  // Check for at least one uppercase, lowercase, digit, and special character
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return 'Password must contain uppercase, lowercase, number, and special character'
  }
  
  // Check for common weak patterns
  if (/(.)\1{3,}/.test(password)) return 'Password cannot have repeated characters'
  if (/123456|password|qwerty|admin/i.test(password)) return 'Password is too common'
  
  return null
}

export const validateName = (name: string): string | null => {
  if (!name) return null // Optional field
  if (name.length > 100) return 'Name is too long'
  if (name.length < 2) return 'Name is too short'
  if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Name contains invalid characters'
  // Check for XSS patterns
  if (/<script|javascript:|data:/i.test(name)) return 'Invalid name format'
  return null
}

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential script tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .replace(/vbscript:/gi, '') // Remove vbscript protocol
    .slice(0, 1000) // Limit length
}

// Rate limiter instance
export const authLimiter = new AuthRateLimiter()

// Security headers for authentication
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
})

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string;
  level: 'weak' | 'fair' | 'good' | 'strong';
} => {
  let score = 0
  let feedback = ''
  
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  if (password.length >= 16) score += 1
  
  if (score < 3) {
    feedback = 'Password is too weak'
    return { score, feedback, level: 'weak' }
  } else if (score < 4) {
    feedback = 'Password could be stronger'
    return { score, feedback, level: 'fair' }
  } else if (score < 6) {
    feedback = 'Good password strength'
    return { score, feedback, level: 'good' }
  } else {
    feedback = 'Excellent password strength'
    return { score, feedback, level: 'strong' }
  }
}
