import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { uploadFile, useApiClient } from '@/lib/api';
import { useAuth } from '@clerk/expo';

jest.mock('@clerk/expo', () => ({
  useAuth: jest.fn(() => ({
    getToken: jest.fn().mockResolvedValue('test-token'),
  })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('uploadFile', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetches the local file URI then uploads to the signed URL via PUT', async () => {
    const blob = new Blob(['data']);
    mockFetch
      .mockResolvedValueOnce({ blob: () => Promise.resolve(blob) })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    await uploadFile('https://signed.example.com/upload', 'file:///img.jpg', 'image/jpeg');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://signed.example.com/upload',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      })
    );
  });

  it('throws with the HTTP status when the upload request fails', async () => {
    const blob = new Blob(['data']);
    mockFetch
      .mockResolvedValueOnce({ blob: () => Promise.resolve(blob) })
      .mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(uploadFile('https://url', 'file:///test.jpg', 'image/jpeg')).rejects.toThrow(
      'Upload failed: 403'
    );
  });
});

describe('useApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      getToken: jest.fn().mockResolvedValue('test-token'),
    });
  });

  it('throws when there is no auth token', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      getToken: jest.fn().mockResolvedValue(null),
    });

    const { result } = renderHook(() => useApiClient());
    await expect(result.current.get('/api/test')).rejects.toThrow('No auth token available');
  });

  it('attaches a Bearer Authorization header to every request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ ok: true }),
    });

    const { result } = renderHook(() => useApiClient());
    await result.current.get('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/test'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('returns null for 204 No Content responses', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204 });

    const { result } = renderHook(() => useApiClient());
    const data = await result.current.delete('/api/resource/1');
    expect(data).toBeNull();
  });

  it('surfaces field-level validation messages from 400 responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: { details: { fieldErrors: { title: ['Title is required'] } } },
      }),
    });

    const { result } = renderHook(() => useApiClient());
    await expect(result.current.post('/api/memories', {})).rejects.toThrow('Title is required');
  });

  it('throws a general error message for non-400 failures', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: { message: 'Internal server error' } }),
    });

    const { result } = renderHook(() => useApiClient());
    await expect(result.current.get('/api/test')).rejects.toThrow(
      'API request failed: 500 Internal server error'
    );
  });

  it('sends GET requests with the correct method', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    });

    const { result } = renderHook(() => useApiClient());
    await result.current.get('/api/memories');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('sends POST requests with a JSON-serialised body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ id: '1' }),
    });

    const { result } = renderHook(() => useApiClient());
    await result.current.post('/api/memories', { title: 'Hello' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Hello' }),
      })
    );
  });

  it('sends PUT requests with a JSON-serialised body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ id: '1', displayName: 'Alice' }),
    });

    const { result } = renderHook(() => useApiClient());
    await result.current.put('/api/users/me/profile', { displayName: 'Alice' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ displayName: 'Alice' }),
      })
    );
  });
});
