'use server';

import {
	createChannel,
	updateChannel,
	deleteChannel,
	getChannelById,
	getChannelsForUser,
} from '@/lib/chat/channels';
import { addChannelMember, isUserInChannel } from '@/lib/chat/channel-members';
import { markChannelMessagesAsRead } from '@/lib/chat/message-reads';
import { Channel } from '@/lib/chat/chat-types';
import { getCurrentUser } from '@/lib/auth';
import { getServerSupabaseClient } from '@/lib/get-server-supabase-client';

export async function createChannelAction(
	name: string,
	description: string
): Promise<{ success: boolean; error?: string; data?: Channel }> {
	try {
		const supabase = await getServerSupabaseClient();
		const user = await getCurrentUser();

		const isAdminUser = await checkIsAdmin(user.id);

		if (!isAdminUser) {
			return {
				success: false,
				error: 'Solo los administradores pueden crear canales',
			};
		}

		// Create channel
		const result = await createChannel(name, description, supabase);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al crear el canal' };
		}

		// Add the admin as a member
		if (result.data) {
			const memberResult = await addChannelMember(result.data.id, user.id, supabase);
			if (memberResult.error) {
				return {
					success: false,
					error:
						memberResult.error.message ||
						'Canal creado pero no se pudo agregar al creador como miembro',
				};
			}
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al crear el canal' };
	}
}

export async function updateChannelAction(
	channelId: number,
	name: string,
	description: string
): Promise<{ success: boolean; error?: string; data?: Channel }> {
	try {
		const supabase = await getServerSupabaseClient();
		const user = await getCurrentUser();

		const isAdminUser = await checkIsAdmin(user.id);

		if (!isAdminUser) {
			return {
				success: false,
				error: 'Solo los administradores pueden editar canales',
			};
		}

		// Update channel
		const result = await updateChannel(channelId, { name, description }, supabase);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al actualizar el canal' };
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al actualizar el canal' };
	}
}

export async function deleteChannelAction(
	channelId: number
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await getServerSupabaseClient();
		const user = await getCurrentUser();

		const isAdminUser = await checkIsAdmin(user.id);

		if (!isAdminUser) {
			return {
				success: false,
				error: 'Solo los administradores pueden eliminar canales',
			};
		}
		// Delete channel
		const result = await deleteChannel(channelId, supabase);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al eliminar el canal' };
		}

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al eliminar el canal' };
	}
}

export async function getUserChannelsAction(): Promise<{
	success: boolean;
	error?: string;
	data?: any[];
}> {
	try {
		const supabase = await getServerSupabaseClient();
		const user = await getCurrentUser();

		// Get user's channels
		const result = await getChannelsForUser(user.id, supabase);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al obtener los canales' };
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al obtener los canales' };
	}
}

export async function getChannelByIdAction(
	channelId: number
): Promise<{ success: boolean; error?: string; data?: Channel; isMember?: boolean }> {
	try {
		const supabase = await getServerSupabaseClient();
		const user = await getCurrentUser();

		// Get channel
		const channelResult = await getChannelById(channelId, supabase);

		if (channelResult.error || !channelResult.data) {
			return { success: false, error: 'Canal no encontrado' };
		}

		// Check if user is member or admin
		const isMemberResult = await isUserInChannel(channelId, user.id, supabase);
		const isAdminUser = await checkIsAdmin(user.id);

		if (!isMemberResult.data && !isAdminUser) {
			return { success: false, error: 'No tienes acceso a este canal' };
		}

		// Mark messages as read when user opens channel
		await markChannelMessagesAsRead(channelId, user.id, supabase);

		return { success: true, data: channelResult.data, isMember: isMemberResult.data };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al obtener el canal' };
	}
}

async function checkIsAdmin(userId: string): Promise<boolean> {
	const supabase = await getServerSupabaseClient();
	const { data } = await supabase.from('users').select('role').eq('uid_user', userId).single();

	return data?.role === 'Admin';
}
