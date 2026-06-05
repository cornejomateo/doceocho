import { EventType, listEventTypes } from '@/lib/calendar/event-types';
import { useOptimizedRealtime } from '@/hooks/use-optimized-realtime';

export function useLoadEventTypes() {
	const {
		data: eventTypes,
		loading: isLoading,
		error,
		refresh,
	} = useOptimizedRealtime<EventType>(
		'events_types',
		async () => {
			const { data, error } = await listEventTypes();
			if (error) throw error;
			return data ?? [];
		},
		'event_types_cache'
	);

	return {
		eventTypes,
		isLoading,
		error,
		refresh,
	};
}
