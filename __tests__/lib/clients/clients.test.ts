import { createClient, updateClient } from '@/lib/clients/clients';
import { getSupabaseClient } from '@/lib/supabase-client';

jest.mock('@/lib/supabase-client', () => ({
	getSupabaseClient: jest.fn(),
}));

function createSupabaseMock() {
	const chain: Record<string, jest.Mock> = {
		select: jest.fn(() => chain),
		order: jest.fn(() => chain),
		eq: jest.fn(() => chain),
		insert: jest.fn(() => chain),
		update: jest.fn(() => chain),
	};

	const supabase = {
		from: jest.fn(() => chain),
	};

	return { supabase, chain };
}

describe('clients lib', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('creates a client with an injected created_at value', async () => {
		const { supabase, chain } = createSupabaseMock();
		chain.single = jest.fn().mockResolvedValue({
			data: { id: 10, name: 'Juan', last_name: 'Pérez' },
			error: null,
		});
		(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

		const payload = {
			name: 'Juan',
			last_name: 'Pérez',
			email: 'juan@example.com',
			phone_number: '123456',
			locality: 'Rosario',
			contact_method: 'WhatsApp',
		};

		const result = await createClient(payload);

		expect(supabase.from).toHaveBeenCalledWith('clients');
		expect(chain.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				...payload,
				created_at: expect.any(String),
			})
		);
		expect(result.data).toEqual({ id: 10, name: 'Juan', last_name: 'Pérez' });
	});

	it('updates a client by id', async () => {
		const { supabase, chain } = createSupabaseMock();
		chain.single = jest.fn().mockResolvedValue({
			data: { id: 10, name: 'Juan', last_name: 'García' },
			error: null,
		});
		(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

		const changes = {
			name: 'Juan',
			last_name: 'García',
			email: 'juan@example.com',
		};

		const result = await updateClient(10, changes);

		expect(supabase.from).toHaveBeenCalledWith('clients');
		expect(chain.update).toHaveBeenCalledWith(changes);
		expect(chain.eq).toHaveBeenCalledWith('id', 10);
		expect(result.data).toEqual({ id: 10, name: 'Juan', last_name: 'García' });
	});
});
