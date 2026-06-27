'use server';

import {
	updateMessage,
	deleteMessage,
	getMessagesByChannel,
	getMessageById,
} from '@/lib/chat/messages';
import { Message } from '@/lib/chat/chat-types';
import { getServerSupabaseClient } from '@/lib/get-server-supabase-client';
import { sendPushNotificationToChannel } from '@/actions/push/send-notification';
import { after } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isUserInChannel } from '@/lib/chat/channel-members';
import { getSupabaseClient } from '@/lib/supabase-client';

export async function sendMessageAction(
	channelId: number,
	content: string,
	replyToId?: number
): Promise<{ success: boolean; error?: string; data?: any }> {
	try {
		const user = await getCurrentUser();

		const trimmed = content.trim();

		if (!trimmed) {
			return { success: false, error: 'El mensaje no puede estar vacío' };
		}

		const supabase = getSupabaseClient();

		const { data, error } = await supabase
			.from('messages')
			.insert({
				content: trimmed,
				channel_id: channelId,
				user_id: user.id,
				reply_to: replyToId ?? null,
				edited_at: null,
				deleted_at: null,
			})
			.select()
			.single();

		if (error) {
			return { success: false, error: error.message };
			console.log('Error al enviar mensaje:', error);
		}

		after(async () => {
			try {
				const { data: channel } = await supabase
					.from('channels')
					.select('name')
					.eq('id', channelId)
					.single();

				await sendPushNotificationToChannel(channelId, user.id, trimmed, channel?.name || 'Canal');
			} catch (err: any) {
				console.error(err);
			}
		});

		return { success: true, data };
	} catch (err: any) {
		return { success: false, error: err.message };
	}
}

export async function editMessageAction(
	messageId: number,
	content: string
): Promise<{ success: boolean; error?: string; data?: Message }> {
	try {
		const user = await getCurrentUser();

		const messageResult = await getMessageById(messageId);

		if (!messageResult.data) {
			return { success: false, error: 'Mensaje no encontrado' };
		}

		const isOwner = messageResult.data.user_id === user.id;
		const isAdminUser = await checkIsAdmin(user.id);

		if (!isOwner && !isAdminUser) {
			return { success: false, error: 'No tienes permiso para editar este mensaje' };
		}

		if (!content.trim()) {
			return {
				success: false,
				error: 'El mensaje no puede estar vacío',
			};
		}

		const result = await updateMessage(messageId, {
			content: content.trim(),
		});

		if (result.error) {
			return {
				success: false,
				error: result.error.message,
			};
		}

		return {
			success: true,
			data: result.data || undefined,
		};
	} catch (err: any) {
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function deleteMessageAction(
	messageId: number
): Promise<{ success: boolean; error?: string; data?: Message }> {
	try {
		const user = await getCurrentUser();

		const messageResult = await getMessageById(messageId);

		if (!messageResult.data) {
			return {
				success: false,
				error: 'Mensaje no encontrado',
			};
		}

		const isOwner = messageResult.data.user_id === user.id;
		const isAdminUser = await checkIsAdmin(user.id);

		if (!isOwner && !isAdminUser) {
			return {
				success: false,
				error: 'No tienes permiso para eliminar este mensaje',
			};
		}

		const result = await deleteMessage(messageId);

		if (result.error) {
			return {
				success: false,
				error: result.error.message,
			};
		}

		return {
			success: true,
			data: result.data || undefined,
		};
	} catch (err: any) {
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function getMessagesAction(
	channelId: number
): Promise<{ success: boolean; error?: string; data?: any[] }> {
	try {
		const user = await getCurrentUser();

		const isMemberResult = await isUserInChannel(channelId, user.id);
		const isAdminUser = await checkIsAdmin(user.id);

		if (!isMemberResult.data && !isAdminUser) {
			return {
				success: false,
				error: 'No tienes acceso a este canal',
			};
		}

		const result = await getMessagesByChannel(channelId);

		if (result.error) {
			return {
				success: false,
				error: result.error.message,
			};
		}

		return {
			success: true,
			data: result.data || undefined,
		};
	} catch (err: any) {
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function cleanChannelMessagesAction(
	channelId: number,
	cleanupDate: string
): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
	try {
		const user = await getCurrentUser();

		const isAdminUser = await checkIsAdmin(user.id);

		if (!isAdminUser) {
			return {
				success: false,
				error: 'Solo los administradores pueden limpiar mensajes del canal',
			};
		}

		const supabase = getSupabaseClient();

		const { data: messagesToDelete, error } = await supabase
			.from('messages')
			.select('id')
			.eq('channel_id', channelId)
			.lt('created_at', cleanupDate);

		if (error) {
			return {
				success: false,
				error: error.message,
			};
		}

		if (!messagesToDelete?.length) {
			return {
				success: true,
				deletedCount: 0,
			};
		}

		for (const message of messagesToDelete) {
			await supabase.from('messages').delete().eq('id', message.id);
		}

		return {
			success: true,
			deletedCount: messagesToDelete.length,
		};
	} catch (err: any) {
		return {
			success: false,
			error: err.message,
		};
	}
}

async function checkIsAdmin(userId: string): Promise<boolean> {
	const supabase = await getServerSupabaseClient();
	const { data } = await supabase.from('users').select('role').eq('uid_user', userId).single();
	return data?.role === 'Admin';
}
