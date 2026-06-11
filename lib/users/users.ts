import { getSupabaseClient } from '../supabase-client';

export type User = {
	username: string;
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
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.order('username', { ascending: true });
	return { data, error };
}
