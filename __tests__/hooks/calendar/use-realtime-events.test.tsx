import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeEvents } from '@/hooks/calendar/use-realtime-events';
import { getSupabaseClient } from '@/lib/supabase-client';

jest.mock('@/lib/supabase-client', () => ({
	getSupabaseClient: jest.fn(),
}));

const mockSubscribe = jest.fn();
const mockOn = jest.fn();
const mockChannel = jest.fn();
const mockRemoveChannel = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	localStorage.clear();

	mockSubscribe.mockReturnValue({});
	mockOn.mockReturnValue({ subscribe: mockSubscribe });
	mockChannel.mockReturnValue({ on: mockOn, subscribe: mockSubscribe });

	(getSupabaseClient as jest.Mock).mockReturnValue({
		channel: mockChannel,
		removeChannel: mockRemoveChannel,
	});
});

describe('useRealtimeEvents', () => {
	it('fetches data on mount', async () => {
		const fetchFromDb = jest.fn().mockResolvedValue([
			{ id: 1, title: 'Event A' },
			{ id: 2, title: 'Event B' },
		]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		expect(result.current.loading).toBe(true);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(fetchFromDb).toHaveBeenCalledTimes(1);
		expect(result.current.data).toEqual([
			{ id: 1, title: 'Event A' },
			{ id: 2, title: 'Event B' },
		]);
		expect(result.current.error).toBeNull();
	});

	it('loads cached data first, then fetches fresh data', async () => {
		localStorage.setItem(
			'infinite_cache_events',
			JSON.stringify({ data: [{ id: 1, title: 'Cached' }] })
		);

		const fetchFromDb = jest.fn().mockResolvedValue([{ id: 2, title: 'Fresh' }]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		expect(result.current.data).toEqual([{ id: 1, title: 'Cached' }]);

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 2, title: 'Fresh' }]);
		});
	});

	it('uses provided cacheKey instead of default', async () => {
		localStorage.setItem('my_custom_key', JSON.stringify({ data: [{ id: 1, title: 'Custom' }] }));

		const fetchFromDb = jest.fn().mockResolvedValue([]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb, 'my_custom_key'));

		expect(result.current.data).toEqual([{ id: 1, title: 'Custom' }]);
	});

	it('handles fetch errors', async () => {
		const fetchFromDb = jest.fn().mockRejectedValue(new Error('Network error'));

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe('Network error');
		expect(result.current.data).toEqual([]);
	});

	it('refreshes data on demand', async () => {
		const fetchFromDb = jest
			.fn()
			.mockResolvedValueOnce([{ id: 1, title: 'Old' }])
			.mockResolvedValueOnce([{ id: 2, title: 'New' }]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 1, title: 'Old' }]);
		});

		await act(async () => {
			await result.current.refresh();
		});

		expect(result.current.data).toEqual([{ id: 2, title: 'New' }]);
		expect(fetchFromDb).toHaveBeenCalledTimes(2);
	});

	it('clears cache and refetches', async () => {
		localStorage.setItem(
			'infinite_cache_events',
			JSON.stringify({ data: [{ id: 1, title: 'Cached' }] })
		);

		const fetchFromDb = jest
			.fn()
			.mockResolvedValueOnce([{ id: 2, title: 'Fresh' }])
			.mockResolvedValueOnce([{ id: 3, title: 'Refreshed' }]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 2, title: 'Fresh' }]);
		});

		await act(async () => {
			result.current.clearCache();
		});

		expect(result.current.data).toEqual([{ id: 3, title: 'Refreshed' }]);
		expect(fetchFromDb).toHaveBeenCalledTimes(2);
	});

	it('subscribes to realtime changes with correct channel config', () => {
		const fetchFromDb = jest.fn().mockResolvedValue([]);

		renderHook(() => useRealtimeEvents('events', fetchFromDb));

		expect(mockChannel).toHaveBeenCalledWith('events-infinite-cache');
		expect(mockOn).toHaveBeenCalledWith(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'events',
			},
			expect.any(Function)
		);
	});

	it('handles INSERT realtime event', async () => {
		const fetchFromDb = jest.fn().mockResolvedValue([{ id: 1, title: 'First' }]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 1, title: 'First' }]);
		});

		const processEvent = mockOn.mock.calls[0][2];
		await act(async () => {
			processEvent({ eventType: 'INSERT', new: { id: 2, title: 'New' } });
		});

		expect(result.current.data).toHaveLength(2);
		expect(result.current.data[0]).toEqual({ id: 2, title: 'New' });
	});

	it('handles UPDATE realtime event by replacing in place', async () => {
		const fetchFromDb = jest.fn().mockResolvedValue([{ id: 1, title: 'Original' }]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 1, title: 'Original' }]);
		});

		const processEvent = mockOn.mock.calls[0][2];
		await act(async () => {
			processEvent({ eventType: 'UPDATE', new: { id: 1, title: 'Updated' } });
		});

		expect(result.current.data).toHaveLength(1);
		expect(result.current.data[0]).toEqual({ id: 1, title: 'Updated' });
	});

	it('refetches on UPDATE when the record is not in current data', async () => {
		const fetchFromDb = jest
			.fn()
			.mockResolvedValueOnce([{ id: 1, title: 'Original' }])
			.mockResolvedValueOnce([
				{ id: 1, title: 'Original' },
				{ id: 3, title: 'Fetched' },
			]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toEqual([{ id: 1, title: 'Original' }]);
		});

		const processEvent = mockOn.mock.calls[0][2];
		await act(async () => {
			processEvent({ eventType: 'UPDATE', new: { id: 3, title: 'Unknown' } });
		});

		await waitFor(() => {
			expect(fetchFromDb).toHaveBeenCalledTimes(2);
		});
	});

	it('handles DELETE realtime event', async () => {
		const fetchFromDb = jest.fn().mockResolvedValue([
			{ id: 1, title: 'First' },
			{ id: 2, title: 'Second' },
		]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toHaveLength(2);
		});

		const processEvent = mockOn.mock.calls[0][2];
		await act(async () => {
			processEvent({ eventType: 'DELETE', old: { id: 1 } });
		});

		expect(result.current.data).toHaveLength(1);
		expect(result.current.data[0]).toEqual({ id: 2, title: 'Second' });
	});

	it('updates cache on realtime events', async () => {
		localStorage.setItem(
			'infinite_cache_events',
			JSON.stringify({ data: [{ id: 1, title: 'Cached' }] })
		);

		const fetchFromDb = jest.fn().mockResolvedValue([]);

		const { result } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		await waitFor(() => {
			expect(result.current.data).toEqual([]);
		});

		const processEvent = mockOn.mock.calls[0][2];
		await act(async () => {
			processEvent({ eventType: 'INSERT', new: { id: 2, title: 'Live' } });
		});

		const cached = JSON.parse(localStorage.getItem('infinite_cache_events')!);
		expect(cached.data).toContainEqual({ id: 2, title: 'Live' });
	});

	it('cleans up subscription on unmount', () => {
		const fetchFromDb = jest.fn().mockResolvedValue([]);

		const { unmount } = renderHook(() => useRealtimeEvents('events', fetchFromDb));

		unmount();

		expect(mockRemoveChannel).toHaveBeenCalled();
	});
});
