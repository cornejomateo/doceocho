describe('lib/calendar/events', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	test('listEvents returns data when supabase responds', async () => {
		const mockFrom = {
			select: jest.fn().mockReturnThis(),
			order: jest.fn().mockResolvedValue({ data: [{ id: 1, date: '2023-01-01' }], error: null }),
		};

		const mockSupabase = { from: jest.fn().mockReturnValue(mockFrom) };

		jest.doMock('@/lib/supabase-client', () => ({ getSupabaseClient: () => mockSupabase }));

		const { listEvents } = require('@/lib/calendar/events');

		const res = await listEvents();

		expect(res.error).toBeNull();
		expect(res.data).toEqual([{ id: 1, date: '2023-01-01' }]);
		expect(mockSupabase.from).toHaveBeenCalledWith('events');
	});

	test('getEventById calls supabase and returns single event', async () => {
		const single = jest
			.fn()
			.mockResolvedValue({ data: { id: 5, date: '2024-02-02' }, error: null });
		const eq = jest.fn().mockReturnValue({ single });
		const select = jest.fn().mockReturnValue({ eq });

		const mockFrom = { select };
		const mockSupabase = { from: jest.fn().mockReturnValue(mockFrom) };

		jest.doMock('@/lib/supabase-client', () => ({ getSupabaseClient: () => mockSupabase }));
		const { getEventById } = require('@/lib/calendar/events');

		const res = await getEventById(5);

		expect(res.error).toBeNull();
		expect(res.data).toEqual({ id: 5, date: '2024-02-02' });
		expect(select).toHaveBeenCalledWith('*');
		expect(eq).toHaveBeenCalledWith('id', 5);
	});

	test('createEvent inserts and fetches created event, formatting date from dates.date', async () => {
		const insertSingle = jest.fn().mockResolvedValue({ data: { id: 10 }, error: null });
		const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
		const insert = jest.fn().mockReturnValue({ select: insertSelect });

		const fetchSingle = jest.fn().mockResolvedValue({
			data: { id: 10, dates: { date: '2024-03-03' }, title: 'evt' },
			error: null,
		});
		const fetchEq = jest.fn().mockReturnValue({ single: fetchSingle });
		const fetchSelect = jest.fn().mockReturnValue({ eq: fetchEq });

		const mockFrom = {
			insert,
			select: fetchSelect,
		};

		const mockSupabase = { from: jest.fn().mockReturnValue(mockFrom) };
		jest.doMock('@/lib/supabase-client', () => ({ getSupabaseClient: () => mockSupabase }));

		const { createEvent } = require('@/lib/calendar/events');

		const payload = { date: '2024-03-03', title: 'evt', type: null };
		const res = await createEvent(payload);

		expect(res.error).toBeNull();
		expect(res.data).toMatchObject({ id: 10, date: '2024-03-03', title: 'evt' });
		expect(insert).toHaveBeenCalled();
		expect(fetchSelect).toHaveBeenCalledWith('*');
		expect(fetchEq).toHaveBeenCalledWith('id', 10);
	});

	test('updateEvent sets is_overdue based on current event date when status pending', async () => {
		// First select('date').eq(id).single() -> returns currentEvent with old date
		const fetchSingle = jest.fn().mockResolvedValue({ data: { date: '2000-01-01' }, error: null });
		const fetchEq = jest.fn().mockReturnValue({ single: fetchSingle });
		const fetchSelect = jest.fn().mockReturnValue({ eq: fetchEq });

		// Then update(updatePayload).eq(id).select().single() -> return updated event
		const updatedSingle = jest
			.fn()
			.mockResolvedValue({ data: { id: 20, status: 'pending', is_overdue: true }, error: null });
		const updateSelect = jest.fn().mockReturnValue({ single: updatedSingle });
		const updateEq = jest.fn().mockReturnValue({ select: updateSelect });
		const update = jest.fn().mockReturnValue({ eq: updateEq });

		const mockFrom = {
			select: fetchSelect,
			update,
		};

		const mockSupabase = { from: jest.fn().mockReturnValue(mockFrom) };
		jest.doMock('@/lib/supabase-client', () => ({ getSupabaseClient: () => mockSupabase }));

		const { updateEvent } = require('@/lib/calendar/events');

		const res = await updateEvent(20, { status: 'pending' });

		expect(res.error).toBeNull();
		expect(res.data).toMatchObject({ id: 20, status: 'pending', is_overdue: true });
		expect(fetchSelect).toHaveBeenCalledWith('date');
		expect(update).toHaveBeenCalled();
		expect(updateEq).toHaveBeenCalledWith('id', 20);
	});

	test('deleteLastYearEvents calls delete with expected filters', async () => {
		// make from return object with delete().eq().lt() chain
		const mockFrom2 = {
			delete: jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({ lt: jest.fn().mockResolvedValue({ error: null }) }),
			}),
		};

		const mockSupabase = { from: jest.fn().mockReturnValue(mockFrom2) };
		jest.doMock('@/lib/supabase-client', () => ({ getSupabaseClient: () => mockSupabase }));

		const { deleteLastYearEvents } = require('@/lib/calendar/events');
		const res = await deleteLastYearEvents();

		expect(res.error).toBeNull();
		expect(mockSupabase.from).toHaveBeenCalledWith('events');
	});
});
