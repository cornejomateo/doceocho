'use server';

import {
	addChannelMember,
	removeChannelMember,
	getChannelMembers,
} from '@/lib/chat/channel-members';
import { getUser, getUserByUid, listUsers } from '@/lib/users/users';

export async function addMemberToChannelAction(
	channelId: number,
	username: string,
	currentUserRole: string
) {
	try {
		if (currentUserRole !== 'Admin') {
			return { success: false, error: 'Solo admins' };
		}

		const targetUserResult = await getUser(username);

		if (!targetUserResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		const result = await addChannelMember(channelId, targetUserResult.data.uid_user);
		if (result.error) {
			return { success: false, error: result.error.message };
		}

		return { success: true, data: result.data };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

export async function removeMemberFromChannelAction(
	channelId: number,
	username: string,
	currentUserRole: string
) {
	try {
		if (currentUserRole !== 'Admin') {
			return { success: false, error: 'Solo admins' };
		}

		const targetUserResult = await getUser(username);

		if (!targetUserResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		const result = await removeChannelMember(channelId, targetUserResult.data.uid_user);
		if (result.error) {
			return { success: false, error: result.error.message };
		}

		return { success: true };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

export async function getChannelMembersAction(channelId: number) {
	try {
		const result = await getChannelMembers(channelId);

		if (result.error) {
			return { success: false, error: result.error.message };
		}

		return { success: true, data: result.data || [] };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

export async function getAvailableUsersAction(
	currentUserId: string
): Promise<{ success: boolean; error?: string; data?: any[] }> {
	try {
		// Get current user
		const userResult = await getUserByUid(currentUserId);
		if (!userResult.data) {
			return { success: false, error: 'Usuario no encontrado' };
		}

		// Check if current user is admin
		if (userResult.data.role !== 'Admin') {
			return { success: false, error: 'Solo los administradores pueden ver usuarios disponibles' };
		}

		// Get all users from the users table
		const result = await listUsers();

		if (result.error) {
			return { success: false, error: result.error.message || 'Error al obtener los usuarios' };
		}

		return { success: true, data: result.data || [] };
	} catch (error: any) {
		return { success: false, error: error.message || 'Error al obtener los usuarios' };
	}
}
