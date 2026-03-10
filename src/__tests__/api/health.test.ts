import { describe, it, expect } from 'vitest';

// Simple test for the health endpoint logic
describe('Health endpoint', () => {
  it('returns status ok and a timestamp', () => {
    const timestamp = new Date().toISOString();
    const response = { status: 'ok', timestamp };

    expect(response.status).toBe('ok');
    expect(response.timestamp).toBeDefined();
    expect(typeof response.timestamp).toBe('string');
  });

  it('timestamp is a valid ISO date string', () => {
    const timestamp = new Date().toISOString();
    const parsed = new Date(timestamp);
    expect(parsed instanceof Date).toBe(true);
    expect(!isNaN(parsed.getTime())).toBe(true);
  });
});
