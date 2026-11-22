# query-build-tools

Build and parse query strings with repeated keys handled correctly.

## Usage

```js
import { buildQuery, parseQuery } from './src/index.js';

const encoded = buildQuery({ tag: ['a b', 'c&d'], page: '2' });
// 'tag=a%20b&tag=c%26d&page=2'

const decoded = parseQuery(encoded);
// { tag: ['a b', 'c&d'], page: '2' }
```

`buildQuery(params)` takes a plain object. Array values become repeated keys in the
order they appear. `undefined` values are skipped; `null` becomes an empty string.
Keys are emitted in insertion order, not sorted, so callers control the exact byte
layout when it matters.

`parseQuery(query)` returns a plain object. A key that appears once is a string; a
key that appears more than once becomes an array in first-seen order. A leading `?`
is optional, and `null` or an empty string yields `{}`.

## Why this exists

Most one-liner query builders either drop repeated keys or force every value into
an array, and most parsers silently keep only the last occurrence of a repeated
key. That loses information that servers commonly rely on (multi-select filters,
repeated `tag` parameters, form checkboxes). This library keeps repeated keys
faithful in both directions and makes the single-vs-array distinction explicit:
single occurrence is a string, multiple occurrences is an array.

The trade-off is that the shape of a parsed value depends on how many times its
key appeared. A caller that always wants an array has to normalise the result
itself. In exchange, the common case of a single value stays simple and the
round-trip preserves exactly what was sent.

## Edge cases

Malformed percent-encoding in `parseQuery` (for example `%ZZ`) does not throw;
the raw segment is returned. `buildQuery` throws a `TypeError` for anything that
is not a plain object, and `parseQuery` throws a `TypeError` for non-string,
non-null input. A key with no `=` is parsed as having an empty-string value.
