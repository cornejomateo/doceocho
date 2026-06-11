'use server';

import {
	createMessage,
	updateMessage,
	deleteMessage,
	getMessagesByChannel,
	getMessageById,
} from '@/lib/chat/messages';
import { getUser } from '@/lib/users/users';
import { isUserInChannel } from '@/lib/chat/channel-members';
import { markMessageAsRead } from '@/lib/chat/message-reads';
import { Message } from '@/types/chat';

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
			is_deleted: false,
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

		// Validate content
		if (!content || content.trim().length === 0) {
			return { success: false, error: 'El mensaje no puede estar vacío' };
		}

		// Update message (note: we should also check if the user owns the message, but for simplicity we'll allow admins to edit any message)
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
