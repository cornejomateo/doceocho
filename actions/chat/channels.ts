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
import { getUser } from '@/lib/users/users';
import { getSupabaseClient } from '@/lib/supabase-client';
import { UserRole } from '@/constants/users/user-role';
import { Channel } from '@/types/chat';

export async function createChannelAction(
	name: string,
	description: string,
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: Channel }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Check if user is admin
		if (userResult.data.role !== 'Admin') {
			return { success: false, error: 'Solo los administradores pueden crear canales' };
		}

		// Create channel
		const result = await createChannel({ name, description });

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al crear el canal' };
		}

		// Add the admin as a member
		if (result.data) {
			await addChannelMember(result.data.id, userResult.data.username);
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al crear el canal' };
	}
}

export async function updateChannelAction(
	channelId: number,
	name: string,
	description: string,
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: Channel }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Check if user is admin
		if (userResult.data.role !== 'Admin') {
			return { success: false, error: 'Solo los administradores pueden editar canales' };
		}

		// Update channel
		const result = await updateChannel(channelId, { name, description });

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al actualizar el canal' };
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al actualizar el canal' };
	}
}

export async function deleteChannelAction(
	channelId: number,
	currentUsername: string
): Promise<{ success: boolean; error?: string }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Check if user is admin
		if (userResult.data.role !== 'Admin') {
			return { success: false, error: 'Solo los administradores pueden eliminar canales' };
		}

		// Delete channel
		const result = await deleteChannel(channelId);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al eliminar el canal' };
		}

		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al eliminar el canal' };
	}
}

export async function getUserChannelsAction(
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: any[] }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Get user's channels
		const result = await getChannelsForUser(userResult.data.username);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al obtener los canales' };
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al obtener los canales' };
	}
}

export async function getChannelByIdAction(
	channelId: number,
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: Channel; isMember?: boolean }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Get channel
		const channelResult = await getChannelById(channelId);

		if (channelResult.error || !channelResult.data) {
			return { success: false, error: 'Canal no encontrado' };
		}

		// Check if user is member or admin
		const isMemberResult = await isUserInChannel(channelId, userResult.data.username);
		const isAdmin = userResult.data.role === 'Admin';

		if (!isMemberResult.data && !isAdmin) {
			return { success: false, error: 'No tienes acceso a este canal' };
		}

		// Mark messages as read when user opens channel
		await markChannelMessagesAsRead(channelId, userResult.data.username);

		return { success: true, data: channelResult.data, isMember: isMemberResult.data };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al obtener el canal' };
	}
}
