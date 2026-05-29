import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimizedRealtime } from '@/hooks/use-optimized-realtime';
import { getSupabaseClient } from '@/lib/supabase-client';

jest.mock('@/lib/supabase-client', () => ({
	getSupabaseClient: jest.fn(),
}));

describe('useOptimizedRealtime', () => {
	const mockSubscribe = jest.fn();
	const mockOn = jest.fn();
	const mockChannel = jest.fn();
	const mockRemoveChannel = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		localStorage.clear();

		mockSubscribe.mockReturnValue({});
		mockOn.mockReturnValue({
			subscribe: mockSubscribe,
		});

		mockChannel.mockReturnValue({
			on: mockOn,
			subscribe: mockSubscribe,
		});

		(getSupabaseClient as jest.Mock).mockReturnValue({
			channel: mockChannel,
			removeChannel: mockRemoveChannel,
		});
	});

	it('fetches data on mount', async () => {
		const fetchFromDb = jest.fn().mockResolvedValue([
			{ id: 1, name: 'Mateo' },
			{ id: 2, name: 'Juan' },
		]);

		const { result } = renderHook(() => useOptimizedRealtime('clients', fetchFromDb));

		expect(result.current.loading).toBe(true);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(fetchFromDb).toHaveBeenCalledTimes(1);

		expect(result.current.data).toEqual([
			{ id: 1, name: 'Mateo' },
			{ id: 2, name: 'Juan' },
		]);
	});

	it('loads data from cache first', async () => {
		localStorage.setItem(
			'test_cache',
			JSON.stringify({
				data: [{ id: 1, name: 'Cached user' }],
				timestamp: Date.now(),
				version: 1,
			})
		);

		const fetchFromDb = jest.fn().mockResolvedValue([{ id: 2, name: 'Fresh user' }]);

		const { result } = renderHook(() => useOptimizedRealtime('clients', fetchFromDb, 'test_cache'));

		expect(result.current.data).toEqual([{ id: 1, name: 'Cached user' }]);

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 2, name: 'Fresh user' }]);
		});
	});

	it('handles fetch errors', async () => {
		const fetchFromDb = jest.fn().mockRejectedValue(new Error('DB Error'));

		const { result } = renderHook(() => useOptimizedRealtime('clients', fetchFromDb));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe('DB Error');
		expect(result.current.data).toEqual([]);
	});

	it('refreshes data manually', async () => {
		const fetchFromDb = jest
			.fn()
			.mockResolvedValueOnce([{ id: 1, name: 'Old' }])
			.mockResolvedValueOnce([{ id: 2, name: 'New' }]);

		const { result } = renderHook(() => useOptimizedRealtime('clients', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 1, name: 'Old' }]);
		});

		await act(async () => {
			await result.current.refresh();
		});

		expect(result.current.data).toEqual([{ id: 2, name: 'New' }]);
	});

	it('invalidates cache and refetches', async () => {
		localStorage.setItem(
			'test_cache',
			JSON.stringify({
				data: [{ id: 1, name: 'Cached' }],
				timestamp: Date.now(),
				version: 1,
			})
		);

		const fetchFromDb = jest.fn().mockResolvedValue([{ id: 2, name: 'Fresh' }]);

		const { result } = renderHook(() => useOptimizedRealtime('clients', fetchFromDb, 'test_cache'));

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 2, name: 'Fresh' }]);
		});

		await act(async () => {
			result.current.invalidateCache();
		});

		expect(localStorage.getItem('test_cache')).not.toContain('Cached');
	});

	it('subscribes to realtime changes', () => {
		const fetchFromDb = jest.fn().mockResolvedValue([]);

		renderHook(() => useOptimizedRealtime('clients', fetchFromDb));

		expect(mockChannel).toHaveBeenCalledWith('clients-optimized-realtime');

		expect(mockOn).toHaveBeenCalledWith(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'clients',
			},
			expect.any(Function)
		);
	});

	it('cleans up realtime subscription on unmount', () => {
		const fetchFromDb = jest.fn().mockResolvedValue([]);

		const { unmount } = renderHook(() => useOptimizedRealtime('clients', fetchFromDb));

		unmount();

		expect(mockRemoveChannel).toHaveBeenCalled();
	});
});
