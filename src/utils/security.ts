// Security utilities for input sanitization and validation

/**
 * Sanitize string input to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (input === null || input === undefined) {
    return null
  }
  
  return input
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["']?[^"']*["']?/gi, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove javascript: and data: protocols
    .replace(/(javascript|data|vbscript):/gi, '')
    // Trim whitespace
    .trim()
}

/**
 * Sanitize an object by applying sanitizeString to all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : 
        item
      )
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized as T
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  
  const sanitized = email.toLowerCase().trim()
  
  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return null
  }
  
  return sanitized
}

/**
 * Sanitize phone number - remove all non-numeric characters except + for international
 */
export function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  return phone.replace(/[^\d+]/g, '').trim() || null
}

/**
 * Validate and sanitize ID parameter (must be positive integer)
 */
export function sanitizeId(id: string | number | null | undefined): number | null {
  if (id === null || id === undefined) return null
  
  const num = typeof id === 'string' ? parseInt(id, 10) : id
  
  if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    return null
  }
  
  return num
}

/**
 * Sanitize JSON string fields before storing
 * Use this for fields that might contain user-generated content
 */
export function sanitizeJsonContent(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJsonContent)
  }
  
  if (typeof obj === 'object') {
    return sanitizeObject(obj)
  }
  
  return obj
}

/**
 * Check if string contains potential XSS patterns
 * Returns true if suspicious content detected
 */
export function containsXssPatterns(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /<svg.*on\w+\s*=/i
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Middleware-compatible sanitizer for Hono
 * Sanitizes common text fields in request body
 */
export function createSanitizer(fields: string[]) {
  return async (c: any, next: any) => {
    try {
      const body = await c.req.json()
      
      for (const field of fields) {
        if (body[field] !== undefined) {
          if (typeof body[field] === 'string') {
            body[field] = sanitizeString(body[field])
          } else if (typeof body[field] === 'object') {
            body[field] = sanitizeJsonContent(body[field])
          }
        }
      }
      
      // Store sanitized body for later use
      c.set('sanitizedBody', body)
      
      await next()
    } catch {
      // If body parsing fails, continue anyway
      await next()
    }
  }
}
