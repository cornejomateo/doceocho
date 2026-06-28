'use server';

import { getCurrentUser } from '@/lib/auth';
import { getServerSupabaseClient } from '@/lib/get-server-supabase-client';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const TABLE = 'channel_members';

export async function addChannelMember(
	channelId: number,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	console.log(`[addChannelMember] Adding member userId=${userId} to channelId=${channelId}`);
	try {
		const supabase = await getServerSupabaseClient();
		const { error } = await supabase
			.from(TABLE)
			.insert({ channel_id: channelId, user_id: userId })
			.select()
			.single();

		if (error) {
			console.error(
				`[addChannelMember] Error adding member userId=${userId} to channelId=${channelId}:`,
				error.message
			);
			return { success: false, error: error.message };
		}
		console.log(`[addChannelMember] Successfully added userId=${userId} to channelId=${channelId}`);
		return { success: true };
	} catch (error: any) {
		console.error(
			`[addChannelMember] Exception adding userId=${userId} to channelId=${channelId}:`,
			error.message
		);
		return { success: false, error: error.message };
	}
}

export async function addMemberToChannelAction(channelId: number, userId: string) {
	console.log(
		`[addMemberToChannelAction] Adding member userId=${userId} to channelId=${channelId}`
	);
	try {
		const supabase = await getServerSupabaseClient();
		await getCurrentUser();

		const adminSupabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const { error } = await adminSupabase
			.from(TABLE)
			.insert({ channel_id: channelId, user_id: userId })
			.select()
			.single();

		if (error) {
			console.error(
				`[addMemberToChannelAction] Error adding userId=${userId} to channelId=${channelId}:`,
				error.message
			);
			return { success: false, error: error.message };
		}
		console.log(
			`[addMemberToChannelAction] Successfully added userId=${userId} to channelId=${channelId}`
		);
		return { success: true };
	} catch (e: any) {
		console.error(
			`[addMemberToChannelAction] Exception adding userId=${userId} to channelId=${channelId}:`,
			e.message
		);
		return { success: false, error: e.message };
	}
}

export async function removeMemberFromChannelAction(channelId: number, userId: string) {
	try {
		const supabase = await getServerSupabaseClient();
		await getCurrentUser();

		const { error } = await supabase
			.from(TABLE)
			.delete()
			.eq('channel_id', channelId)
			.eq('user_id', userId);

		if (error) return { success: false, error: error.message };
		return { success: true };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

export async function getChannelMembersAction(channelId: number) {
	try {
		await getCurrentUser();

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const { data, error } = await supabase
			.from(TABLE)
			.select(
				`*,
				users!inner (
					username,
					role,
					name,
					last_name,
					uid_user
				)
				`
			)
			.eq('channel_id', channelId)
			.order('joined_at', { ascending: true });

		if (error) return { success: false, error: error.message };
		return { success: true, data: data || [] };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

export async function getAvailableUsersAction() {
	try {
		const supabase = await getServerSupabaseClient();
		await getCurrentUser();

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session?.access_token) {
			return { success: false, error: 'No autenticado' };
		}

		const h = await headers();
		const host = h.get('host');
		const proto = h.get('x-forwarded-proto') || 'http';
		const url = `${proto}://${host}/api/users`;

		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${session.access_token}` },
		});

		const body = await res.json();

		if (!res.ok) {
			return { success: false, error: body.error || 'Error al listar usuarios' };
		}

		return { success: true, data: body.data || [] };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

export async function updateLastReadMessage(
	messageId: number,
	channelId: number,
	userId: string
): Promise<{ success: boolean; error?: any }> {
	try {
		const supabase = await getServerSupabaseClient();

		const { error } = await supabase
			.from(TABLE)
			.update({ last_read_message_id: messageId })
			.eq('user_id', userId)
			.eq('channel_id', channelId)
			.or(`last_read_message_id.is.null,last_read_message_id.lt.${messageId}`);

		return { success: !error, error };
	} catch (error) {
		return { success: false, error };
	}
}
