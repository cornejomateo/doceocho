import {
	listEventTypes,
	createEventType,
	updateEventType,
	deleteEventType,
	getEventTypeOptions,
	resolveEventType,
} from '@/lib/calendar/event-types';

import { getSupabaseClient } from '@/lib/supabase-client';

jest.mock('@/lib/supabase-client', () => ({
	getSupabaseClient: jest.fn(),
}));

describe('event-types', () => {
	let mockSupabase: any;

	beforeEach(() => {
		jest.clearAllMocks();

		mockSupabase = {
			from: jest.fn(),
		};

		(getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
	});

	describe('listEventTypes', () => {
		it('returns event types ordered by created_at', async () => {
			const result = {
				data: [{ id: 1, name: 'Reunión', color: '#000' }],
				error: null,
			};

			mockSupabase.from.mockReturnValue({
				select: () => ({
					order: () => result,
				}),
			});

			const response = await listEventTypes();

			expect(mockSupabase.from).toHaveBeenCalledWith('events_types');
			expect(response).toEqual(result);
		});
	});

	describe('createEventType', () => {
		it('creates an event type', async () => {
			const result = {
				data: {
					id: 1,
					name: 'Reunión',
					color: '#000',
				},
				error: null,
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue(result),
					}),
				}),
			});

			const response = await createEventType({
				name: ' Reunión ',
				color: '#000',
			});

			expect(response).toEqual(result);
		});
	});

	describe('updateEventType', () => {
		it('updates an event type', async () => {
			const result = {
				data: {
					id: 1,
					name: 'Actualizado',
					color: '#111',
				},
				error: null,
			};

			mockSupabase.from.mockReturnValue({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						select: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue(result),
						}),
					}),
				}),
			});

			const response = await updateEventType(1, {
				name: ' Actualizado ',
			});

			expect(response).toEqual(result);
		});
	});

	describe('deleteEventType', () => {
		it('deletes an event type', async () => {
			mockSupabase.from.mockReturnValue({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						error: null,
					}),
				}),
			});

			const response = await deleteEventType(1);

			expect(response).toEqual({
				data: null,
				error: null,
			});
		});
	});

	describe('getEventTypeOptions', () => {
		it('maps event types to options', () => {
			const options = getEventTypeOptions([
				{
					id: 1,
					name: 'Reunión',
					color: '#123456',
				},
			]);

			expect(options).toEqual([
				{
					value: 'Reunión',
					label: 'Reunión',
					color: '#123456',
				},
			]);
		});

		it('returns empty array when no event types exist', () => {
			expect(getEventTypeOptions([])).toEqual([]);
		});
	});

	describe('resolveEventType', () => {
		it('returns matching custom type', () => {
			const result = resolveEventType('Reunión', [
				{
					id: 1,
					name: 'Reunión',
					color: '#ff0000',
				},
			]);

			expect(result).toEqual({
				value: 'Reunión',
				label: 'Reunión',
				color: '#ff0000',
			});
		});

		it('returns fallback when type does not exist', () => {
			const result = resolveEventType('Inexistente', []);

			expect(result).toEqual({
				value: 'Inexistente',
				label: 'Inexistente',
				color: '#64748b',
			});
		});

		it('returns "otros" when type is null', () => {
			const result = resolveEventType(null, []);

			expect(result).toEqual({
				value: 'otros',
				label: 'otros',
				color: '#64748b',
			});
		});
	});
});
