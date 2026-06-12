'use server';

import {
	createMessage,
	updateMessage,
	deleteMessage,
	getMessagesByChannel,
	getMessageById,
	hardDeleteMessage,
} from '@/lib/chat/messages';
import { getUser } from '@/lib/users/users';
import { isUserInChannel } from '@/lib/chat/channel-members';
import { markMessageAsRead } from '@/lib/chat/message-reads';
import { Message } from '@/types/chat';
import { getSupabaseClient } from '@/lib/supabase-client';

export async function sendMessageAction(
	channelId: number,
	content: string,
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: Message }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Check if user is member of the channel
		const isMemberResult = await isUserInChannel(channelId, userResult.data.username);
		const isAdmin = userResult.data.role === 'Admin';

		if (!isMemberResult.data && !isAdmin) {
			return { success: false, error: 'No tienes acceso a este canal' };
		}

		// Validate content
		if (!content || content.trim().length === 0) {
			return { success: false, error: 'El mensaje no puede estar vacío' };
		}

		// Create message
		const result = await createMessage({
			content: content.trim(),
			channel_id: channelId,
			user_id: userResult.data.username,
			edited_at: null,
			deleted_at: null,
		});

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al enviar el mensaje' };
		}

		// Mark message as read for the sender
		if (result.data) {
			await markMessageAsRead(result.data.id, userResult.data.username);
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al enviar el mensaje' };
	}
}

export async function editMessageAction(
	messageId: number,
	content: string,
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: Message }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Get message to check ownership
		const messageResult = await getMessageById(messageId);
		if (messageResult.error || !messageResult.data) {
			return { success: false, error: 'Mensaje no encontrado' };
		}

		// Check if user is the message owner or admin
		const isOwner = messageResult.data.user_id === userResult.data.username;
		const isAdmin = userResult.data.role === 'Admin';

		if (!isOwner && !isAdmin) {
			return { success: false, error: 'No tienes permiso para editar este mensaje' };
		}

		// Validate content
		if (!content || content.trim().length === 0) {
			return { success: false, error: 'El mensaje no puede estar vacío' };
		}

		// Update message
		const result = await updateMessage(messageId, { content: content.trim() });

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al editar el mensaje' };
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al editar el mensaje' };
	}
}

export async function deleteMessageAction(
	messageId: number,
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: Message }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Get message to check ownership
		const messageResult = await getMessageById(messageId);
		if (messageResult.error || !messageResult.data) {
			return { success: false, error: 'Mensaje no encontrado' };
		}

		// Check if user is the message owner or admin
		const isOwner = messageResult.data.user_id === userResult.data.username;
		const isAdmin = userResult.data.role === 'Admin';

		if (!isOwner && !isAdmin) {
			return { success: false, error: 'No tienes permiso para eliminar este mensaje' };
		}

		// Soft delete message
		const result = await deleteMessage(messageId);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al eliminar el mensaje' };
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al eliminar el mensaje' };
	}
}

export async function getMessagesAction(
	channelId: number,
	currentUsername: string
): Promise<{ success: boolean; error?: string; data?: any[] }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Check if user is member of the channel
		const isMemberResult = await isUserInChannel(channelId, userResult.data.username);
		const isAdmin = userResult.data.role === 'Admin';

		if (!isMemberResult.data && !isAdmin) {
			return { success: false, error: 'No tienes acceso a este canal' };
		}

		// Get messages
		const result = await getMessagesByChannel(channelId);

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al obtener los mensajes' };
		}

		return { success: true, data: result.data || undefined };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al obtener los mensajes' };
	}
}

export async function cleanChannelMessagesAction(
	channelId: number,
	cleanupDate: string,
	currentUsername: string
): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
	try {
		// Get current user
		const userResult = await getUser(currentUsername);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Only admin can clean channel messages
		if (userResult.data.role !== 'Admin') {
			return {
				success: false,
				error: 'Solo los administradores pueden limpiar mensajes del canal',
			};
		}

		const supabase = getSupabaseClient();

		// Get all messages before the cleanup date
		const { data: messagesToDelete, error: fetchError } = await supabase
			.from('messages')
			.select('id')
			.eq('channel_id', channelId)
			.lt('created_at', cleanupDate);

		if (fetchError) {
			return { success: false, error: fetchError.message || 'Error al obtener mensajes' };
		}

		if (!messagesToDelete || messagesToDelete.length === 0) {
			return { success: true, deletedCount: 0 };
		}

		const messageIds = messagesToDelete.map((m) => m.id);

		// Delete message_reads for these messages
		for (const messageId of messageIds) {
			await supabase.from('message_reads').delete().eq('message_id', messageId);
		}

		// Hard delete the messages
		for (const messageId of messageIds) {
			await supabase.from('messages').delete().eq('id', messageId);
		}

		return { success: true, deletedCount: messageIds.length };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al limpiar mensajes del canal' };
	}
}
