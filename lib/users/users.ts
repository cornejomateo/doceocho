import { getSupabaseClient } from '../supabase-client';

export type User = {
	uid_user?: string;
	username: string;
	role: string;
	mail?: string;
};

export type CreateUserInput = {
	username: string;
	password: string;
	role: string;
	mail?: string;
};

export async function getUser(username: string): Promise<{ data: User | null; error: any }> {
	const supabase = getSupabaseClient();
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
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from('users').select('*').order('username');

	if (error) {
		return { data: null, error: 'Error al listar usuarios' };
	}

	return { data: data ?? [], error: null };
}

export async function createUser(
	input: CreateUserInput
): Promise<{ data: any; error: string | null }> {
	try {
		const res = await fetch('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(input),
		});

		const body = await res.json();

		if (!res.ok) {
			return { data: null, error: body.error || 'Error al crear usuario' };
		}

		return { data: body, error: null };
	} catch (err: any) {
		return { data: null, error: err.message || 'Error de red al crear usuario' };
	}
}

export async function updateUserPassword(
	uid_user: string,
	password: string
): Promise<{ error: string | null }> {
	try {
		const res = await fetch('/api/users', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uid_user, password }),
		});

		if (!res.ok) {
			const body = await res.json();
			return { error: body.error || 'Error al actualizar contraseña' };
		}

		return { error: null };
	} catch (err: any) {
		return { error: err.message || 'Error de red al actualizar contraseña' };
	}
}

export async function deleteUser(uid_user: string): Promise<{ error: string | null }> {
	try {
		const res = await fetch('/api/users', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uid_user }),
		});

		if (!res.ok) {
			const body = await res.json();
			return { error: body.error || 'Error al eliminar usuario' };
		}

		return { error: null };
	} catch (err: any) {
		return { error: err.message || 'Error de red al eliminar usuario' };
	}
}

export async function updateUser(
	uid_user: string,
	changes: Partial<Pick<User, 'username' | 'role'>>
): Promise<{ data: User | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from('users')
		.update(changes)
		.eq('uid_user', uid_user)
		.select()
		.single();

	if (error) {
		return { data: null, error: 'Error al actualizar usuario' };
	}

	return { data, error: null };
}
