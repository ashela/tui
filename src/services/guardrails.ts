// Security guardrails for Kereru AI
// Prevents misuse, secrets leakage, harmful content, and toxicity

interface GuardrailResult {
  allowed: boolean;
  reason?: string;
  toxicityScore?: number;
}

interface SafetyLogEntry {
  timestamp: string;
  type: 'prompt' | 'output';
  content: string;
  isSafe: boolean;
  reason?: string;
  toxicityScore?: number;
}

// ----------------------------
// 1) Secret pattern detection
// ----------------------------

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA|EC|OPENSSH|DSA)? ?PRIVATE KEY-----/i,
  /\bAKIA[0-9A-Z]{16}\b/,                     // AWS Access Key ID
  /\bASIA[0-9A-Z]{16}\b/,                     // AWS temp key
  /\bghp_[A-Za-z0-9]{36,}\b/,                 // GitHub classic PAT
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,         // Slack tokens
  /\bAIza[0-9A-Za-z\-_]{35}\b/,               // Google API key (common pattern)
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,  // JWT-ish
  /\b(api[_-]?key|secret|token|password)\s*[:=]\s*\S{8,}/i,
];

// ----------------------------
// 2) Disallowed intent checks
// ----------------------------

const DISALLOWED_PATTERNS = [
  // Self-harm instruction seeking
  /\b(how to|best way to|methods to)\b.*\b(kill myself|suicide|self-harm)\b/i,

  // Weapons/explosives instruction
  /\b(how to|instructions|guide|recipe|make|create|build|manufacture)\b.*\b(bomb|explosive|pipe bomb|napalm|gunpowder|black powder|thermite|molotov)\b/i,
  /\b(how to)\b.*\b(make)\b.*\b(gun|firearm|silencer|suppressor)\b/i,
  /\b(gunpowder|black powder)\b.*\b(recipe|formula|how to|make|create|ingredients)\b/i,

  // Malware / hacking
  /\b(write|create|generate)\b.*\b(malware|ransomware|keylogger|trojan)\b/i,
  /\b(how to)\b.*\b(steal|phish|bypass|hack)\b.*\b(password|account|2fa|otp)\b/i,

  // Doxxing
  /\b(find|dox|track)\b.*\b(address|phone|email|ssn|ird number)\b/i,

  // CSAM (always block)
  /\b(child porn|csam|minor)\b.*\b(sex|nude|explicit)\b/i,
];

// ----------------------------
// 3) Additional NZ-specific patterns
// ----------------------------

const NZ_DISALLOWED_PATTERNS = [
  // Fraud patterns
  /\b(fake|forge|counterfeit)\b.*\b(ird|tax return|passport|driver license|licence)\b/i,
  /\b(how to)\b.*\b(evade|avoid|skip)\b.*\b(tax|gst|paye|ird)\b/i,

  // Immigration fraud
  /\b(fake|fraudulent)\b.*\b(work visa|residence|citizenship|immigration)\b/i,
];

// ----------------------------
// 4) Toxicity detection patterns
// ----------------------------

const TOXICITY_PATTERNS = [
  // Hate speech
  { pattern: /\b(nigger|faggot|retard|cunt|bitch)\b/i, weight: 0.9 },
  { pattern: /\b(hate|kill|murder|die)\b.*\b(jews|muslims|christians|gays|women|men)\b/i, weight: 0.95 },

  // Severe profanity
  { pattern: /\b(fuck|shit|damn|ass|hell)\b/gi, weight: 0.3 },

  // Threats
  { pattern: /\b(i will|going to|gonna)\b.*\b(kill|hurt|harm|attack)\b/i, weight: 0.85 },
  { pattern: /\b(threat|threaten)\b/i, weight: 0.6 },

  // Sexual content
  { pattern: /\b(sex|porn|xxx|nude|naked)\b/i, weight: 0.4 },

  // Harassment
  { pattern: /\b(harass|stalk|dox|bully)\b/i, weight: 0.7 },

  // Violence
  { pattern: /\b(beat|torture|abuse|assault)\b/i, weight: 0.75 },
];

/**
 * Calculate toxicity score for text (0.0 to 1.0)
 * Returns score based on pattern matching
 */
function checkToxicity(text: string): number {
  let maxScore = 0;

  for (const { pattern, weight } of TOXICITY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      // Multiple matches increase the score slightly
      const matchCount = matches.length;
      const score = Math.min(weight + (matchCount - 1) * 0.1, 1.0);
      maxScore = Math.max(maxScore, score);
    }
  }

  return maxScore;
}

// ----------------------------
// 5) Output sanitization (XSS protection)
// ----------------------------

/**
 * Sanitize output to prevent XSS attacks
 * Escapes HTML special characters
 * Note: Single quotes (') are NOT escaped as they're safe in HTML content
 * and escaping them breaks normal contractions like "you're", "don't", etc.
 */
export function sanitizeOutput(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  };

  return text.replace(/[&<>"]/g, (char) => htmlEscapeMap[char] || char);
}

// ----------------------------
// 6) Safety logging
// ----------------------------

/**
 * Log safety check results for auditing and debugging
 */
export function logSafetyCheck(
  type: 'prompt' | 'output',
  content: string,
  isSafe: boolean,
  reason?: string,
  toxicityScore?: number
): void {
  const logEntry: SafetyLogEntry = {
    timestamp: new Date().toISOString(),
    type,
    content: content.substring(0, 200), // Log first 200 chars only
    isSafe,
    reason,
    toxicityScore,
  };

  // In production, send to your logging service (e.g., CloudWatch, Datadog)
  // For now, console logging
  if (!isSafe) {
    console.warn('[SAFETY] Blocked content:', logEntry);
  } else if (toxicityScore && toxicityScore > 0.5) {
    console.warn('[SAFETY] High toxicity detected:', logEntry);
  } else {
    console.log('[SAFETY] Content passed:', {
      timestamp: logEntry.timestamp,
      type,
      isSafe,
      toxicityScore
    });
  }

  // Optional: Write to file or send to external logging service
  // This would require a backend endpoint in production
}

// ----------------------------
// Helper functions
// ----------------------------

function containsSecrets(text: string): string | null {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      return pattern.source;
    }
  }
  return null;
}

function isDisallowed(text: string): string | null {
  // Check general disallowed patterns
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(text)) {
      return pattern.source;
    }
  }
  
  // Check NZ-specific patterns
  for (const pattern of NZ_DISALLOWED_PATTERNS) {
    if (pattern.test(text)) {
      return pattern.source;
    }
  }
  
  return null;
}

// ----------------------------
// Main guardrail functions
// ----------------------------

const MAX_PROMPT_CHARS = 20000;
const MAX_OUTPUT_CHARS = 50000;
const TOXICITY_THRESHOLD = 0.7; // Block content with toxicity > 0.7

/**
 * Check if a user prompt passes all guardrails
 */
export function checkPromptGuardrails(prompt: string): GuardrailResult {
  // Hard size limit
  if (prompt.length > MAX_PROMPT_CHARS) {
    logSafetyCheck('prompt', prompt, false, 'prompt_too_long');
    return {
      allowed: false,
      reason: 'prompt_too_long'
    };
  }

  // Check for secrets
  const secretHit = containsSecrets(prompt);
  if (secretHit) {
    console.warn('Blocked prompt containing secrets');
    logSafetyCheck('prompt', prompt, false, 'secrets_in_prompt');
    return {
      allowed: false,
      reason: 'secrets_in_prompt'
    };
  }

  // Check for disallowed content
  const disallowedHit = isDisallowed(prompt);
  if (disallowedHit) {
    console.warn('Blocked disallowed request:', disallowedHit);
    logSafetyCheck('prompt', prompt, false, 'disallowed_request');
    return {
      allowed: false,
      reason: 'disallowed_request'
    };
  }

  // Check toxicity
  const toxicityScore = checkToxicity(prompt);
  if (toxicityScore > TOXICITY_THRESHOLD) {
    console.warn('Blocked toxic prompt with score:', toxicityScore);
    logSafetyCheck('prompt', prompt, false, 'toxic_content', toxicityScore);
    return {
      allowed: false,
      reason: 'toxic_content',
      toxicityScore
    };
  }

  // Log safe prompt
  logSafetyCheck('prompt', prompt, true, undefined, toxicityScore);
  return { allowed: true, toxicityScore };
}

/**
 * Check if a model output passes all guardrails
 */
export function checkOutputGuardrails(output: string): GuardrailResult {
  // Size check
  if (output.length > MAX_OUTPUT_CHARS) {
    logSafetyCheck('output', output, false, 'output_too_long');
    return {
      allowed: false,
      reason: 'output_too_long'
    };
  }

  // Check for secrets in output
  const secretHit = containsSecrets(output);
  if (secretHit) {
    console.warn('Blocked output containing secrets');
    logSafetyCheck('output', output, false, 'secrets_in_output');
    return {
      allowed: false,
      reason: 'secrets_in_output'
    };
  }

  // Check for disallowed content in output
  const disallowedHit = isDisallowed(output);
  if (disallowedHit) {
    console.warn('Blocked disallowed output');
    logSafetyCheck('output', output, false, 'disallowed_output');
    return {
      allowed: false,
      reason: 'disallowed_output'
    };
  }

  // Check toxicity in output
  const toxicityScore = checkToxicity(output);
  if (toxicityScore > TOXICITY_THRESHOLD) {
    console.warn('Blocked toxic output with score:', toxicityScore);
    logSafetyCheck('output', output, false, 'toxic_output', toxicityScore);
    return {
      allowed: false,
      reason: 'toxic_output',
      toxicityScore
    };
  }

  // Log safe output
  logSafetyCheck('output', output, true, undefined, toxicityScore);
  return { allowed: true, toxicityScore };
}

/**
 * Get a safe refusal message based on the reason
 */
export function getSafeRefusalMessage(reason: string): string {
  const messages: Record<string, string> = {
    'prompt_too_long': 'Your message is too long. Please keep it under 20,000 characters.',
    'secrets_in_prompt': 'Your message appears to contain sensitive information like API keys or passwords. Please remove them before continuing.',
    'disallowed_request': 'I can\'t help with that request. If you share what you\'re trying to achieve at a high level, I can suggest a safer alternative.',
    'toxic_content': 'Your message contains inappropriate or harmful language. Please rephrase your question respectfully.',
    'secrets_in_output': 'The response contained sensitive information and has been blocked for your safety.',
    'disallowed_output': 'The response contained inappropriate content and has been blocked.',
    'toxic_output': 'The response contained inappropriate content and has been blocked for your safety.',
    'output_too_long': 'The response was too long. Please try asking a more specific question.',
  };

  return messages[reason] || 'I can\'t help with that request. Please try asking something else.';
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 30, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Export a default rate limiter instance
export const rateLimiter = new RateLimiter(30, 60000); // 30 requests per minute
