import { describe, expect, it } from 'vitest';

import { formatDuration } from '../../utils/formatDuration';

describe('formatDuration', () => {
  it('returns ms for values < 1000', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('returns seconds for values >= 1000', () => {
    expect(formatDuration(1000)).toBe('1.00s');
    expect(formatDuration(1500)).toBe('1.50s');
    expect(formatDuration(10000)).toBe('10.00s');
  });

  it('handles large values', () => {
    expect(formatDuration(60000)).toBe('60.00s');
    expect(formatDuration(123456)).toBe('123.46s');
  });
});
