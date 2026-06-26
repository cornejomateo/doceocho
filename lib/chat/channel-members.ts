import { getSupabaseClient } from '../supabase-client';
import { ChannelMember } from '@/lib/chat/chat-types';

const TABLE = 'channel_members';

export async function getChannelMembers(
	channelId: number
): Promise<{ data: ChannelMember[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select(
			`*,
			users!inner (
				username,
				role,
				name,
				last_name,
				user_uid
			)
			`
		)
		.eq('channel_id', channelId)
		.order('joined_at', { ascending: true });

	return { data, error };
}

export async function addChannelMember(
	channelId: number,
	userId: string
): Promise<{ data: ChannelMember | null; error: any }> {
	const supabase = getSupabaseClient();
	console.log('Adding member to channel:', channelId, userId);
	const { data, error } = await supabase
		.from(TABLE)
		.insert({ channel_id: channelId, user_id: userId })
		.select()
		.single();

	return { data, error };
}

export async function removeChannelMember(
	channelId: number,
	userId: string
): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { error } = await supabase
		.from(TABLE)
		.delete()
		.eq('channel_id', channelId)
		.eq('user_id', userId);
	return { data: null, error };
}

export async function isUserInChannel(
	channelId: number,
	userId: string
): Promise<{ data: boolean; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select('*')
		.eq('channel_id', channelId)
		.eq('user_id', userId)
		.maybeSingle();

	if (error) {
		return { data: false, error };
	}

	return { data: !!data, error: null };
}

export async function getUserChannels(userId: string): Promise<{
	data: ChannelMember[] | null;
	error: any;
}> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select('*')
		.eq('user_id', userId)
		.order('joined_at', { ascending: false });

	return { data, error };
}

export async function updateLastReadMessage(
	message_id: number,
	channel_id: number,
	userId: string
): Promise<{ success: boolean; error?: any }> {
	try {
		const supabase = getSupabaseClient();

		const { error } = await supabase
			.from('channel_members')
			.update({
				last_read_message_id: message_id,
			})
			.eq('user_id', userId)
			.eq('channel_id', channel_id)
			.or(`last_read_message_id.is.null,last_read_message_id.lt.${message_id}`);

		return { success: !error, error };
	} catch (error) {
		return { success: false, error };
	}
}
