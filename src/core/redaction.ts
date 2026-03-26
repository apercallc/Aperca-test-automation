const REDACTION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/gi,
    replacement: '[REDACTED_SLACK_WEBHOOK]',
  },
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[REDACTED_EMAIL]',
  },
  {
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/g,
    replacement: '[REDACTED_PHONE]',
  },
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[REDACTED_SSN]',
  },
  {
    pattern: /\b(?:sk|rk|pk)_(?:live|test)?[A-Za-z0-9_-]{10,}\b/g,
    replacement: '[REDACTED_API_KEY]',
  },
  {
    pattern: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g,
    replacement: '[REDACTED_GITHUB_TOKEN]',
  },
  {
    pattern: /\bBearer\s+[A-Za-z0-9._-]+\b/gi,
    replacement: 'Bearer [REDACTED_TOKEN]',
  },
];

export function redactString(value: string): string {
  const patternRedacted = REDACTION_PATTERNS.reduce(
    (result, entry) => result.replace(entry.pattern, entry.replacement),
    value,
  );

  return patternRedacted.replace(
    /\b(password|passwd|pwd|token|secret|api[_-]?key|authorization|cookie)\b(\s*[:=]\s*)(["']?)([^"',\s]+)(\3)/gi,
    (match, field, separator, quote, fieldValue, closingQuote) => {
      const normalized = String(fieldValue).trim().toLowerCase().replace(/[^a-z]/g, '');
      const safeLiterals = new Set(['missing', 'configured', 'disabled', 'enabled', 'true', 'false']);
      if (safeLiterals.has(normalized) || normalized.length < 8) {
        return match;
      }

      return `${field}${separator}${quote}[REDACTED]${closingQuote}`;
    },
  );
}

export function sanitizeForPersistence<T>(value: T): T {
  return sanitizeRecursive(value) as T;
}

function sanitizeRecursive(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRecursive(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeRecursive(item)]),
    );
  }

  return value;
}
