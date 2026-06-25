import { UserRole } from '@/constants/users/user-role';

export type User = {
	uid_user?: string;
	username: string;
	name?: string;
	last_name?: string;
	role: UserRole;
	mail?: string;
};

export type CreateUserInput = {
	username: string;
	password: string;
	role: UserRole;
	mail?: string;
	name?: string;
	last_name?: string;
};

async function getAuthHeaders() {
	const { getSupabaseClient } = await import('../supabase-client');
	const {
		data: { session },
	} = await getSupabaseClient().auth.getSession();

	if (!session?.access_token) {
		throw new Error('No autenticado');
	}

	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${session.access_token}`,
	};
}

async function apiFetch(path: string, options?: RequestInit) {
	const headers = await getAuthHeaders();
	const res = await fetch(path, { ...options, headers });

	const body = res.headers.get('content-type')?.includes('application/json')
		? await res.json()
		: null;

	if (!res.ok) {
		throw new Error(body?.error || `Error ${res.status}`);
	}

	return body;
}

export async function getUser(username: string): Promise<{ data: User | null; error: any }> {
	const supabase = (await import('../supabase-client')).getSupabaseClient();
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.eq('username', username)
		.maybeSingle();

	if (error) {
		return { data: null, error: 'Error al buscar usuario' };
	}

	if (!data) {
		return { data: null, error: 'Usuario no encontrado' };
	}

	return { data, error: null };
}

export async function listUsers(): Promise<{ data: User[] | null; error: any }> {
	try {
		const body = await apiFetch('/api/users');
		return { data: body.data ?? [], error: null };
	} catch (err: any) {
		return { data: null, error: err.message || 'Error al listar usuarios' };
	}
}

export async function createUser(
	input: CreateUserInput
): Promise<{ data: any; error: string | null }> {
	try {
		const body = await apiFetch('/api/users', {
			method: 'POST',
			body: JSON.stringify(input),
		});
		return { data: body, error: null };
	} catch (err: any) {
		return { data: null, error: err.message || 'Error al crear usuario' };
	}
}

export async function updateUserPassword(
	uid_user: string,
	password: string
): Promise<{ error: string | null }> {
	try {
		await apiFetch('/api/users', {
			method: 'PUT',
			body: JSON.stringify({ uid_user, password }),
		});
		return { error: null };
	} catch (err: any) {
		return { error: err.message || 'Error al actualizar contraseña' };
	}
}

export async function deleteUser(uid_user: string): Promise<{ error: string | null }> {
	try {
		await apiFetch('/api/users', {
			method: 'DELETE',
			body: JSON.stringify({ uid_user }),
		});
		return { error: null };
	} catch (err: any) {
		return { error: err.message || 'Error al eliminar usuario' };
	}
}

export async function updateUser(
	uid_user: string,
	changes: Partial<Pick<User, 'username' | 'role'>>
): Promise<{ data: User | null; error: any }> {
	try {
		const body = await apiFetch('/api/users', {
			method: 'PUT',
			body: JSON.stringify({ uid_user, ...changes }),
		});
		return { data: body.data, error: null };
	} catch (err: any) {
		return { data: null, error: err.message || 'Error al actualizar usuario' };
	}
}
