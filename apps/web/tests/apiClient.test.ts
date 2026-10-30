import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, setAuthToken } from '../src/api/client.js';

describe('Web API Client & Auth Configuration', () => {
  beforeEach(() => {
    setAuthToken(null);
  });

  it('initializes with correct base URL and JSON content type', () => {
    expect(apiClient.defaults.baseURL).toBe('/api/v1');
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('dynamically sets Bearer authorization header when token provided', () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    setAuthToken(testToken);

    expect(apiClient.defaults.headers.common['Authorization']).toBe(`Bearer ${testToken}`);
  });

  it('removes authorization header cleanly when token is null', () => {
    setAuthToken('temporary-token');
    expect(apiClient.defaults.headers.common['Authorization']).toBe('Bearer temporary-token');

    setAuthToken(null);
    expect(apiClient.defaults.headers.common['Authorization']).toBeUndefined();
  });
});

