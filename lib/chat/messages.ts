import { getSupabaseClient } from '../supabase-client';
import { Message, MessageWithUser } from '@/lib/chat/chat-types';

const TABLE = 'messages';

export async function getMessagesByChannel(
	channelId: number,
	limit = 50
): Promise<{ data: MessageWithUser[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select(
			`*,
				users!inner (
					username,
					role,
					name,
					last_name
				)
			`
		)
		.eq('channel_id', channelId)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error || !data) {
		return { data: null, error };
	}

	return { data: data.reverse() as MessageWithUser[], error: null };
}

export async function getMessageById(
	id: number
): Promise<{ data: MessageWithUser | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select(
			`
			*,
			users!inner (
				username,
				role,
				name,
				last_name
			)
		`
		)
		.eq('id', id)
		.single();

	return { data, error };
}

export async function createMessage(
	message: Omit<Message, 'id' | 'created_at'>
): Promise<{ data: Message | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).insert(message).select().single();
	return { data, error };
}

export async function updateMessage(
	id: number,
	changes: Partial<Message>
): Promise<{ data: Message | null; error: any }> {
	const supabase = getSupabaseClient();
	const payload = {
		...changes,
		edited_at: new Date().toISOString(),
	};
	const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
	return { data, error };
}

export async function deleteMessage(id: number): Promise<{ data: Message | null; error: any }> {
	const supabase = getSupabaseClient();
	const payload = {
		deleted_at: new Date().toISOString(),
	};
	const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
	return { data, error };
}

export async function hardDeleteMessage(id: number): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { error } = await supabase.from(TABLE).delete().eq('id', id);
	return { data: null, error };
}
