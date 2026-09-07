// Rate limiting utility for authentication and API endpoints
// Implements in-memory rate limiting with configurable limits

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  // Check if IP/identifier is rate limited
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      return false;
    }

    // Reset if window has expired
    if (now > entry.resetTime) {
      this.attempts.delete(identifier);
      return false;
    }

    return entry.count >= this.maxAttempts;
  }

  // Record an attempt and return if rate limited
  recordAttempt(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New entry or expired window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }

    // Increment existing entry
    entry.count++;
    return entry.count > this.maxAttempts;
  }

  // Get remaining time until reset (in seconds)
  getResetTime(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) return 0;
    
    const remaining = Math.max(0, entry.resetTime - Date.now());
    return Math.ceil(remaining / 1000);
  }

  // Reset attempts for identifier
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  // Clean up expired entries (should be called periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Create rate limiter instances for different endpoints
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const apiRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

// Utility function to get client IP address
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Middleware function for rate limiting
export function withRateLimit(rateLimiter: RateLimiter) {
  return function(handler: (request: Request) => Promise<Response>) {
    return async function(request: Request): Promise<Response> {
      const clientIP = getClientIP(request);
      
      if (rateLimiter.isRateLimited(clientIP)) {
        const resetTime = rateLimiter.getResetTime(clientIP);
        
        return new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
            retryAfter: resetTime
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': resetTime.toString(),
              'X-RateLimit-Limit': rateLimiter['maxAttempts'].toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(Date.now() + resetTime * 1000).toISOString()
            }
          }
        );
      }

      // Record the attempt
      const isLimited = rateLimiter.recordAttempt(clientIP);
      
      try {
        const response = await handler(request);
        
        // Add rate limit headers to successful responses
        const remaining = Math.max(0, rateLimiter['maxAttempts'] - (rateLimiter['attempts'].get(clientIP)?.count || 0));
        response.headers.set('X-RateLimit-Limit', rateLimiter['maxAttempts'].toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        
        return response;
      } catch (error) {
        // If the handler throws an error, we still want to respect rate limiting
        throw error;
      }
    };
  };
}

// Clean up expired entries every hour
setInterval(() => {
  authRateLimiter.cleanup();
  apiRateLimiter.cleanup();
}, 60 * 60 * 1000);

export default RateLimiter;
