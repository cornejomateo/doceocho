/**
 * @jest-environment node
 */

import { POST } from '@/app/api/login/route';

jest.mock('@supabase/supabase-js', () => ({
	createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(require('@supabase/supabase-js').createClient);

function mockSupabase(overrides: Record<string, any> = {}) {
	const defaultChain = {
		select: jest.fn().mockReturnThis(),
		eq: jest.fn().mockReturnThis(),
		single: jest.fn(),
	};

	mockCreateClient.mockReturnValue({
		from: jest.fn(() => ({ ...defaultChain, ...overrides })),
	});
	return defaultChain;
}

describe('POST /api/login', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.url';
		process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
	});

	it('returns user data when username exists', async () => {
		const chain = mockSupabase();
		chain.single.mockResolvedValue({
			data: {
				mail: 'admin@test.com',
				username: 'admin1',
				role: 'Admin',
				name: 'Admin',
				last_name: 'User',
			},
			error: null,
		});

		const req = new Request('http://localhost/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: 'admin1' }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.data.mail).toBe('admin@test.com');
		expect(body.data.role).toBe('Admin');
	});

	it('returns 401 when username does not exist', async () => {
		const chain = mockSupabase();
		chain.single.mockResolvedValue({
			data: null,
			error: { message: 'Not found' },
		});

		const req = new Request('http://localhost/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: 'unknown' }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(401);
		expect(body.error).toBe('Usuario o contraseña incorrectos');
	});
});
