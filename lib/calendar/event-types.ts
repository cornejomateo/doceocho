import { getSupabaseClient } from '@/lib/supabase-client';

export type EventType = {
	id: number;
	created_at?: string;
	color: string;
	name: string;
};

export type EventTypeOption = {
	value: string;
	label: string;
	color: string;
};

const TABLE = 'events_types';

function normalizeTypeValue(value: string) {
	return value?.trim();
}

export async function listEventTypes(): Promise<{ data: EventType[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select('*')
		.order('created_at', { ascending: true });

	return { data, error };
}

export async function createEventType(
	eventType: Omit<EventType, 'id' | 'created_at'>
): Promise<{ data: EventType | null; error: any }> {
	const supabase = getSupabaseClient();
	const payload = {
		...eventType,
		name: normalizeTypeValue(eventType.name),
	};

	const { data, error } = await supabase.from(TABLE).insert(payload).select().single();

	return { data, error };
}

export async function updateEventType(
	id: number,
	changes: Partial<EventType>
): Promise<{ data: EventType | null; error: any }> {
	const supabase = getSupabaseClient();
	const payload = {
		...changes,
		name: Object.prototype.hasOwnProperty.call(changes, 'name')
			? normalizeTypeValue(changes.name || '')
			: changes.name,
	};

	const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();

	return { data, error };
}

export async function deleteEventType(id: number): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { error } = await supabase.from(TABLE).delete().eq('id', id);

	return { data: null, error };
}

export function getEventTypeOptions(eventTypes: EventType[]): EventTypeOption[] {
	return eventTypes.map((eventType) => ({
		value: eventType.name,
		label: eventType.name,
		color: eventType.color,
	}));
}

export function resolveEventType(type: string | null | undefined, eventTypes: EventType[] = []) {
	const value = normalizeTypeValue(type || 'otros');
	const customType = eventTypes.find((eventType) => normalizeTypeValue(eventType.name) === value);

	if (customType) {
		return {
			value,
			label: normalizeTypeValue(customType.name) || value,
			color: normalizeTypeValue(customType.color) || '#64748b',
		};
	}

	return {
		value,
		label: value,
		color: '#64748b',
	};
}
