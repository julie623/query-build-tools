import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildQuery, parseQuery } from '../src/index.js';

test('buildQuery joins simple key/value pairs', () => {
  assert.equal(buildQuery({ a: '1', b: '2' }), 'a=1&b=2');
});

test('buildQuery encodes reserved characters', () => {
  assert.equal(buildQuery({ q: 'a b&c' }), 'q=a%20b%26c');
});

test('buildQuery repeats keys for array values in order', () => {
  assert.equal(buildQuery({ tag: ['x', 'y', 'z'] }), 'tag=x&tag=y&tag=z');
});

test('buildQuery skips undefined values but keeps null as empty string', () => {
  assert.equal(buildQuery({ a: undefined, b: null, c: '1' }), 'b=&c=1');
});

test('buildQuery preserves insertion order of keys', () => {
  assert.equal(buildQuery({ z: '1', a: '2' }), 'z=1&a=2');
});

test('buildQuery rejects non-object input', () => {
  assert.throws(() => buildQuery('a=1'), TypeError);
});

test('parseQuery returns empty object for empty input', () => {
  assert.deepEqual(parseQuery(''), {});
  assert.deepEqual(parseQuery('?'), {});
  assert.deepEqual(parseQuery(null), {});
});

test('parseQuery decodes percent-encoding and plus signs', () => {
  assert.deepEqual(parseQuery('q=a%20b%26c'), { q: 'a b&c' });
  assert.deepEqual(parseQuery('q=a+b'), { q: 'a b' });
});

test('parseQuery collects repeated keys into an array', () => {
  assert.deepEqual(parseQuery('tag=x&tag=y&tag=z'), { tag: ['x', 'y', 'z'] });
});

test('parseQuery handles a key with no equals sign', () => {
  assert.deepEqual(parseQuery('flag'), { flag: '' });
});

test('parseQuery tolerates malformed percent-encoding', () => {
  assert.deepEqual(parseQuery('a=%ZZ'), { a: '%ZZ' });
});

test('parseQuery accepts a leading question mark', () => {
  assert.deepEqual(parseQuery('?a=1&b=2'), { a: '1', b: '2' });
});

test('round-trips repeated keys through buildQuery and parseQuery', () => {
  const original = { tag: ['a b', 'c&d'], page: '2' };
  const encoded = buildQuery(original);
  assert.equal(encoded, 'tag=a%20b&tag=c%26d&page=2');
  assert.deepEqual(parseQuery(encoded), { tag: ['a b', 'c&d'], page: '2' });
});
