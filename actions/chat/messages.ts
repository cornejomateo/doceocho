'use server';

import {
	updateMessage,
	deleteMessage,
	getMessagesByChannel,
	getMessageById,
} from '@/lib/chat/messages';
import { getUserByUid } from '@/lib/users/users';
import { isUserInChannel } from '@/lib/chat/channel-members';
import { Message } from '@/lib/chat/chat-types';
import { getSupabaseClient } from '@/lib/supabase-client';
import { sendPushNotificationToChannel } from '@/actions/push/send-notification';
import { after } from 'next/server';

export async function sendMessageAction(
	channelId: number,
	content: string,
	currentUserId: string,
	replyToId?: number
): Promise<{ success: boolean; error?: string; data?: any }> {
	try {
		// Validate content (cheap, no DB)
		const trimmed = content?.trim();

		if (!trimmed) {
			return { success: false, error: 'El mensaje no puede estar vacío' };
		}

		const supabase = getSupabaseClient();

		// INSERT ONLY (fast path)
		const { data, error } = await supabase
			.from('messages')
			.insert({
				content: trimmed,
				channel_id: channelId,
				user_id: currentUserId,
				reply_to: replyToId ?? null,
				edited_at: null,
				deleted_at: null,
			})
			.select()
			.single();

		if (error) {
			return { success: false, error: error.message };
		}

		// Async side effects (NO bloquean request)
		after(async () => {
			try {
				// push notifications (async only)
				const { data: channel } = await supabase
					.from('channels')
					.select('name')
					.eq('id', channelId)
					.single();

				await sendPushNotificationToChannel(
					channelId,
					currentUserId,
					trimmed,
					channel?.name || 'Canal'
				);
			} catch (err: any) {
				console.error('Push notification error:', err.message);
			}
		});

		return { success: true, data };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al enviar el mensaje' };
	}
}

export async function editMessageAction(
	messageId: number,
	content: string,
	currentUserId: string
): Promise<{ success: boolean; error?: string; data?: Message }> {
	try {
		// Get current user
		const userResult = await getUserByUid(currentUserId);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Get message to check ownership
		const messageResult = await getMessageById(messageId);
		if (messageResult.error || !messageResult.data) {
			return { success: false, error: 'Mensaje no encontrado' };
		}

		// Check if user is the message owner or admin
		const isOwner = messageResult.data.user_id === currentUserId;
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
	currentUserId: string
): Promise<{ success: boolean; error?: string; data?: Message }> {
	try {
		// Get current user
		const userResult = await getUserByUid(currentUserId);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Get message to check ownership
		const messageResult = await getMessageById(messageId);
		if (messageResult.error || !messageResult.data) {
			return { success: false, error: 'Mensaje no encontrado' };
		}

		// Check if user is the message owner or admin
		const isOwner = messageResult.data.user_id === currentUserId;
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
	currentUserId: string
): Promise<{ success: boolean; error?: string; data?: any[] }> {
	try {
		// Get current user
		const userResult = await getUserByUid(currentUserId);
		console.log('User result:', userResult);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Check if user is member of the channel
		const isMemberResult = await isUserInChannel(channelId, currentUserId);
		const isAdmin = userResult.data.role === 'Admin';

		if (!isMemberResult.data && !isAdmin) {
			return { success: false, error: 'No tienes acceso a este canal' };
		}

		// Get messages
		const result = await getMessagesByChannel(channelId);
		console.log(result);

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
	currentUserId: string
): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
	try {
		// Get current user
		const userResult = await getUserByUid(currentUserId);
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

		// Hard delete the messages
		for (const messageId of messageIds) {
			await supabase.from('messages').delete().eq('id', messageId);
		}

		return { success: true, deletedCount: messageIds.length };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al limpiar mensajes del canal' };
	}
}
