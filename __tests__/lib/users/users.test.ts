import {
	getUser,
	listUsers,
	createUser,
	deleteUser,
	updateUser,
	updateUserPassword,
} from '@/lib/users/users';
import { getSupabaseClient } from '@/lib/supabase-client';

jest.mock('@/lib/supabase-client', () => ({
	getSupabaseClient: jest.fn(),
}));

function createSupabaseMock() {
	const chain: Record<string, jest.Mock> = {
		select: jest.fn(() => chain),
		order: jest.fn(() => chain),
		eq: jest.fn(() => chain),
		update: jest.fn(() => chain),
		delete: jest.fn(() => chain),
	};

	const supabase = {
		from: jest.fn(() => chain),
	};

	return { supabase, chain };
}

describe('users lib', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('listUsers', () => {
		it('returns all users ordered by username', async () => {
			const { supabase, chain } = createSupabaseMock();

			chain.order = jest.fn().mockResolvedValue({
				data: [
					{ uid_user: '1', username: 'admin', role: 'Admin' },
					{ uid_user: '2', username: 'taller', role: 'Taller' },
				],
				error: null,
			});

			(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

			const result = await listUsers();

			expect(supabase.from).toHaveBeenCalledWith('users');
			expect(chain.select).toHaveBeenCalledWith('*');
			expect(chain.order).toHaveBeenCalledWith('username');
			expect(result.data).toHaveLength(2);
			expect(result.data?.[0].username).toBe('admin');
		});

		it('returns error on failure', async () => {
			const { supabase, chain } = createSupabaseMock();

			chain.order = jest.fn().mockResolvedValue({
				data: null,
				error: { message: 'DB error' },
			});

			(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

			const result = await listUsers();

			expect(result.error).toBe('Error al listar usuarios');
			expect(result.data).toBeNull();
		});
	});

	describe('createUser', () => {
		beforeEach(() => {
			global.fetch = jest.fn();
		});

		it('calls POST /api/users with correct payload', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			});

			const result = await createUser({
				username: 'nuevo',
				password: '123456',
				role: 'Taller',
			});

			expect(global.fetch).toHaveBeenCalledWith('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: 'nuevo', password: '123456', role: 'Taller' }),
			});
			expect(result.error).toBeNull();
			expect(result.data).toEqual({ success: true });
		});

		it('returns error when API fails', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'El usuario ya existe' }),
			});

			const result = await createUser({
				username: 'existente',
				password: '123456',
				role: 'Taller',
			});

			expect(result.error).toBe('El usuario ya existe');
			expect(result.data).toBeNull();
		});

		it('returns network error on fetch failure', async () => {
			(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

			const result = await createUser({
				username: 'test',
				password: '123456',
				role: 'Taller',
			});

			expect(result.error).toBe('Network error');
		});
	});

	describe('deleteUser', () => {
		beforeEach(() => {
			global.fetch = jest.fn();
		});

		it('calls DELETE /api/users with uid_user', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			});

			const result = await deleteUser('abc-123');

			expect(global.fetch).toHaveBeenCalledWith('/api/users', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ uid_user: 'abc-123' }),
			});
			expect(result.error).toBeNull();
		});

		it('returns error when API fails', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Usuario no encontrado' }),
			});

			const result = await deleteUser('abc-123');

			expect(result.error).toBe('Usuario no encontrado');
		});
	});

	describe('updateUser', () => {
		it('updates user role', async () => {
			const { supabase, chain } = createSupabaseMock();

			chain.single = jest.fn().mockResolvedValue({
				data: { uid_user: '1', username: 'user1', role: 'Admin' },
				error: null,
			});

			(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

			const result = await updateUser('1', { role: 'Admin' });

			expect(supabase.from).toHaveBeenCalledWith('users');
			expect(chain.update).toHaveBeenCalledWith({ role: 'Admin' });
			expect(chain.eq).toHaveBeenCalledWith('uid_user', '1');
			expect(result.data?.role).toBe('Admin');
		});

		it('updates username', async () => {
			const { supabase, chain } = createSupabaseMock();

			chain.single = jest.fn().mockResolvedValue({
				data: { uid_user: '1', username: 'newuser', role: 'Taller' },
				error: null,
			});

			(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

			const result = await updateUser('1', { username: 'newuser' });

			expect(chain.update).toHaveBeenCalledWith({ username: 'newuser' });
			expect(result.data?.username).toBe('newuser');
		});
	});

	describe('updateUserPassword', () => {
		beforeEach(() => {
			global.fetch = jest.fn();
		});

		it('calls PUT /api/users with uid_user and password', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			});

			const result = await updateUserPassword('abc-123', 'newpass');

			expect(global.fetch).toHaveBeenCalledWith('/api/users', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ uid_user: 'abc-123', password: 'newpass' }),
			});
			expect(result.error).toBeNull();
		});

		it('returns error when API fails', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				json: async () => ({ error: 'Error al actualizar' }),
			});

			const result = await updateUserPassword('abc-123', 'newpass');

			expect(result.error).toBe('Error al actualizar');
		});
	});

	describe('getUser', () => {
		it('returns user by username', async () => {
			const { supabase, chain } = createSupabaseMock();

			chain.maybeSingle = jest.fn().mockResolvedValue({
				data: { uid_user: '1', username: 'admin', role: 'Admin' },
				error: null,
			});

			(getSupabaseClient as jest.Mock).mockReturnValue(supabase);

			const result = await getUser('admin');

			expect(supabase.from).toHaveBeenCalledWith('users');
			expect(chain.select).toHaveBeenCalledWith('*');
			expect(chain.eq).toHaveBeenCalledWith('username', 'admin');
			expect(result.data?.username).toBe('admin');
		});
	});
});
