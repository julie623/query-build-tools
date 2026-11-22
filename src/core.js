const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const encodeComponent = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return encodeURIComponent(String(value));
};

/**
 * Build a query string from an object. Array values produce repeated keys.
 *
 * We deliberately do not sort keys: insertion order is preserved so that callers
 * can control the exact byte layout of the query string when it matters.
 */
export function buildQuery(params) {
  if (!isPlainObject(params)) {
    throw new TypeError('buildQuery expects a plain object');
  }

  const parts = [];

  for (const key of Object.keys(params)) {
    const value = params[key];

    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        parts.push(`${encodeComponent(key)}=${encodeComponent(item)}`);
      }
    } else {
      parts.push(`${encodeComponent(key)}=${encodeComponent(value)}`);
    }
  }

  return parts.join('&');
}

/**
 * Parse a query string into a plain object.
 *
 * Repeated keys become arrays in the order they appear. A key that appears once
 * is a string. The leading `?` is optional. A missing query string yields an
 * empty object so callers do not need a null check before iterating.
 */
export function parseQuery(query) {
  if (query === null || query === undefined) {
    return {};
  }

  if (typeof query !== 'string') {
    throw new TypeError('parseQuery expects a string');
  }

  const input = query.startsWith('?') ? query.slice(1) : query;

  if (input === '') {
    return {};
  }

  const result = {};

  for (const pair of input.split('&')) {
    if (pair === '') {
      continue;
    }

    const eqIndex = pair.indexOf('=');
    let rawKey;
    let rawValue;

    if (eqIndex === -1) {
      rawKey = pair;
      rawValue = '';
    } else {
      rawKey = pair.slice(0, eqIndex);
      rawValue = pair.slice(eqIndex + 1);
    }

    const key = decodeComponent(rawKey);
    const value = decodeComponent(rawValue);

    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

function decodeComponent(raw) {
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '));
  } catch {
    // Malformed percent-encoding is common in the wild. Returning the raw
    // segment is more useful than throwing, and matches what most servers do.
    return raw;
  }
}
