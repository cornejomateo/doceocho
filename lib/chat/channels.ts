'use server';

import { getCurrentUser } from '@/lib/auth';
import { getServerSupabaseClient } from '@/lib/get-server-supabase-client';
import { addChannelMember } from '@/lib/chat/channel-members';
import type { Channel, ChannelWithMembers, ChannelWithLastMessage } from '@/lib/chat/chat-types';

const TABLE = 'channels';

export async function createChannelAction(
	name: string,
	description: string
): Promise<{ success: boolean; error?: string; data?: Channel }> {
	console.log(`[createChannelAction] Creating channel name=${name}`);
	try {
		const supabase = await getServerSupabaseClient();
		const user = await getCurrentUser();
		console.log(`[createChannelAction] Authenticated user userId=${user.id}`);

		const { data, error } = await supabase
			.from(TABLE)
			.insert({ name, description })
			.select()
			.single();

		if (error) {
			console.error(`[createChannelAction] Error creating channel:`, error.message);
			return { success: false, error: error.message };
		}
		if (!data) {
			console.error(`[createChannelAction] No data returned when creating channel`);
			return { success: false, error: 'Error al crear el canal' };
		}

		console.log(
			`[createChannelAction] Channel created channelId=${data.id}, adding creator as member`
		);
		const memberResult = await addChannelMember(data.id, user.id);
		if (memberResult.error) {
			console.error(`[createChannelAction] Error adding creator as member:`, memberResult.error);
			return { success: false, error: memberResult.error };
		}

		console.log(`[createChannelAction] Successfully created channel channelId=${data.id}`);
		return { success: true, data };
	} catch (error: any) {
		console.error(`[createChannelAction] Exception:`, error.message);
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
		await getCurrentUser();

		const { data, error } = await supabase
			.from(TABLE)
			.update({ name, description })
			.eq('id', channelId)
			.select()
			.single();

		if (error) return { success: false, error: error.message };
		return { success: true, data };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al actualizar el canal' };
	}
}

export async function deleteChannelAction(
	channelId: number
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await getServerSupabaseClient();
		await getCurrentUser();

		const { error } = await supabase.from(TABLE).delete().eq('id', channelId);
		if (error) return { success: false, error: error.message };
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al eliminar el canal' };
	}
}

export async function getUserChannelsAction(): Promise<{
	success: boolean;
	error?: string;
	data?: ChannelWithLastMessage[];
}> {
	try {
		const supabase = await getServerSupabaseClient();
		const user = await getCurrentUser();

		const { data, error } = await supabase
			.from('channel_members')
			.select(
				`
				channel_id,
				last_read_message_id,
				channels (
					id,
					created_at,
					name,
					description,
					last_message_id
				)
			`
			)
			.eq('user_id', user.id);

		if (error) return { success: false, error: error.message };
		if (!data) return { success: true, data: [] };

		const { data: unreadData, error: unreadError } = await supabase.rpc(
			'get_unread_counts_by_channel',
			{ p_user_id: user.id }
		);

		if (unreadError) return { success: true, data: [] };

		const unreadMap = new Map(
			(unreadData || []).map((item: any) => [Number(item.channel_id), Number(item.unread_count)])
		);

		const channels = data.map((item: any) => ({
			...item.channels,
			unread_count: unreadMap.get(item.channel_id) || 0,
			last_read_message_id: item.last_read_message_id,
		}));

		return { success: true, data: channels };
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

		const { data: channel, error } = await supabase
			.from(TABLE)
			.select('*')
			.eq('id', channelId)
			.single();

		if (error || !channel) {
			return { success: false, error: 'Canal no encontrado' };
		}

		const { data: membership } = await supabase
			.from('channel_members')
			.select('id')
			.eq('channel_id', channelId)
			.eq('user_id', user.id)
			.maybeSingle();

		return { success: true, data: channel, isMember: !!membership };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al obtener el canal' };
	}
}
