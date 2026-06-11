'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import {
	addMemberToChannelAction,
	removeMemberFromChannelAction,
	getAvailableUsersAction,
} from '@/actions/chat/channel-members';
import { ChannelWithLastMessage } from '@/types/chat';

interface ChannelMembersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	channel: ChannelWithLastMessage | null;
	members: any[];
	onMembersUpdated: () => void;
	currentUsername: string;
	currentUserRole: string;
}

export function ChannelMembersDialog({
	open,
	onOpenChange,
	channel,
	members,
	onMembersUpdated,
	currentUsername,
	currentUserRole,
}: ChannelMembersDialogProps) {
	const [availableUsers, setAvailableUsers] = useState<any[]>([]);
	const [selectedUser, setSelectedUser] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (open) {
			loadAvailableUsers();
		}
	}, [open]);

	const loadAvailableUsers = async () => {
		setLoading(true);
		const result = await getAvailableUsersAction(currentUsername);
		if (result.success && result.data) {
			setAvailableUsers(result.data);
		}
		setLoading(false);
	};

	const handleAddMember = async () => {
		if (!channel || !selectedUser) return;

		setLoading(true);
		setError('');

		const result = await addMemberToChannelAction(channel.id, selectedUser, currentUsername);

		if (result.success) {
			setSelectedUser('');
			onMembersUpdated();
		} else {
			setError(result.error || 'Error al agregar miembro');
		}

		setLoading(false);
	};

	const handleRemoveMember = async (username: string) => {
		if (!channel) return;

		setLoading(true);
		setError('');

		const result = await removeMemberFromChannelAction(channel.id, username, currentUsername);

		if (result.success) {
			onMembersUpdated();
		} else {
			setError(result.error || 'Error al remover miembro');
		}

		setLoading(false);
	};

	const existingMemberUsernames = members.map((m) => m.user_id);
	const availableToAdd = availableUsers.filter(
		(u) => !existingMemberUsernames.includes(u.username)
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Miembros del canal</DialogTitle>
					<DialogDescription>
						{channel?.name || 'Canal'} - {members.length} miembro{members.length !== 1 ? 's' : ''}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					{/* Add Member Section */}
					<div className="space-y-2">
						<Label>Agregar miembro</Label>
						<div className="flex gap-2">
							<select
								className="flex-1 px-3 py-2 border rounded-md"
								value={selectedUser}
								onChange={(e) => setSelectedUser(e.target.value)}
							>
								<option value="">Seleccionar usuario</option>
								{availableToAdd.map((user) => (
									<option key={user.username} value={user.username}>
										{user.username} ({user.role})
									</option>
								))}
							</select>
							<Button onClick={handleAddMember} disabled={loading || !selectedUser} size="icon">
								<UserPlus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{error && <div className="text-sm text-destructive">{error}</div>}

					{/* Members List */}
					<div className="space-y-2">
						<Label>Miembros actuales</Label>
						<ScrollArea className="h-64 border rounded-md p-2">
							{members.length === 0 ? (
								<div className="text-center text-sm text-muted-foreground py-4">
									No hay miembros en este canal
								</div>
							) : (
								<div className="space-y-2">
									{members.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between p-2 bg-muted rounded"
										>
											<div className="flex items-center gap-2">
												<Users className="h-4 w-4 text-muted-foreground" />
												<div>
													<div className="font-medium">
														{member.users?.username || member.user_id}
													</div>
													<div className="text-xs text-muted-foreground">
														{member.users?.role || 'Usuario'}
													</div>
												</div>
											</div>
											{currentUserRole === 'Admin' && member.user_id !== currentUsername && (
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveMember(member.user_id)}
													disabled={loading}
												>
													<UserMinus className="h-4 w-4 text-destructive" />
												</Button>
											)}
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
