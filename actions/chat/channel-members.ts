'use server';

import {
	addChannelMember,
	removeChannelMember,
	getChannelMembers,
} from '@/lib/chat/channel-members';
import { getServerSupabaseClient } from '@/lib/get-server-supabase-client';
import { getUser, listUsers } from '@/lib/users/users';

export async function addMemberToChannelAction(channelId: number, username: string) {
	const supabase = await getServerSupabaseClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: 'No autenticado' };
	}

	if (!(await checkIsAdmin(user.id))) {
		return { success: false, error: 'Solo admins' };
	}

	const targetUserResult = await getUser(username);

	if (!targetUserResult.data) {
		return { success: false, error: 'Usuario no encontrado' };
	}

	return await addChannelMember(channelId, targetUserResult.data.uid_user, supabase);
}

export async function removeMemberFromChannelAction(channelId: number, username: string) {
	const supabase = await getServerSupabaseClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: 'No autenticado' };
	}
	try {
		const targetUserResult = await getUser(username);

		if (!targetUserResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		const result = await removeChannelMember(channelId, targetUserResult.data.uid_user, supabase);
		if (result.error) {
			return { success: false, error: result.error.message };
		}

		return { success: true };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

export async function getChannelMembersAction(channelId: number) {
	const supabase = await getServerSupabaseClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: 'No autenticado' };
	}
	try {
		const result = await getChannelMembers(channelId, supabase);

		if (result.error) {
			return { success: false, error: result.error.message };
		}

		return { success: true, data: result.data || [] };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

async function checkIsAdmin(userId: string): Promise<boolean> {
	const supabase = await getServerSupabaseClient();
	const { data } = await supabase.from('users').select('role').eq('uid_user', userId).single();
	return data?.role === 'Admin';
}

export async function getAvailableUsersAction() {
	const supabase = await getServerSupabaseClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: 'No autenticado' };
	}

	if (!(await checkIsAdmin(user.id))) {
		return { success: false, error: 'Solo admins' };
	}

	const result = await listUsers();

	if (result.error) {
		return {
			success: false,
			error: result.error.message || 'Error al obtener los usuarios',
		};
	}

	return {
		success: true,
		data: result.data || [],
	};
}
