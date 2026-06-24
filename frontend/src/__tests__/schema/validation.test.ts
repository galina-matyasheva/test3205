import { describe, expect, it } from 'vitest';

import { urlSchema, urlsFormSchema } from '../../schema/validation';

describe('urlSchema', () => {
  it('accepts https://example.com', () => {
    expect(urlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('accepts http://localhost:3000', () => {
    expect(urlSchema.safeParse('http://localhost:3000').success).toBe(true);
  });

  it('accepts http://192.168.1.1', () => {
    expect(urlSchema.safeParse('http://192.168.1.1').success).toBe(true);
  });

  it('accepts https://sub.domain.example.com', () => {
    expect(urlSchema.safeParse('https://sub.domain.example.com').success).toBe(true);
  });

  it('rejects ftp://example.com', () => {
    expect(urlSchema.safeParse('ftp://example.com').success).toBe(false);
  });

  it('rejects plain text without protocol', () => {
    expect(urlSchema.safeParse('not-a-url').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(urlSchema.safeParse('').success).toBe(false);
  });

  it('rejects URL with single-label hostname', () => {
    expect(urlSchema.safeParse('https://localhost').success).toBe(true);
  });

  it('rejects URL without TLD', () => {
    expect(urlSchema.safeParse('https://example').success).toBe(false);
  });
});

describe('urlsFormSchema', () => {
  it('accepts array of valid URLs', () => {
    const result = urlsFormSchema.safeParse(['https://example.com', 'https://google.com']);
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = urlsFormSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it('rejects array with invalid URL', () => {
    const result = urlsFormSchema.safeParse(['https://example.com', 'not-a-url']);
    expect(result.success).toBe(false);
  });
});
