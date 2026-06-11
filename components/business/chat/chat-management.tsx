'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Plus, Users, MessageSquare, LogOut, Trash2, Search, X, Edit2 } from 'lucide-react';
import { useAuth } from '@/components/provider/auth-provider';
import { getUserChannelsAction, deleteChannelAction } from '@/actions/chat/channels';
import {
	sendMessageAction,
	getMessagesAction,
	deleteMessageAction,
	editMessageAction,
} from '@/actions/chat/messages';
import { getChannelMembersAction } from '@/actions/chat/channel-members';
import { ChannelWithLastMessage, MessageWithUser } from '@/types/chat';
import { CreateChannelDialog } from './create-channel-dialog';
import { ChannelMembersDialog } from './channel-members-dialog';

export function ChatManagement() {
	const { user } = useAuth();
	const [channels, setChannels] = useState<ChannelWithLastMessage[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<ChannelWithLastMessage | null>(null);
	const [messages, setMessages] = useState<MessageWithUser[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showMembersDialog, setShowMembersDialog] = useState(false);
	const [members, setMembers] = useState<any[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [showSearch, setShowSearch] = useState(false);
	const [editingMessage, setEditingMessage] = useState<{ id: number; content: string } | null>(
		null
	);

	const filteredMessages = searchTerm
		? messages.filter(
				(msg) =>
					msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					msg.users?.username?.toLowerCase().includes(searchTerm.toLowerCase())
			)
		: messages;

	useEffect(() => {
		if (user) {
			loadChannels();
		}
	}, [user]);

	useEffect(() => {
		if (selectedChannel && user) {
			loadMessages(selectedChannel.id);
		}
	}, [selectedChannel, user]);

	const loadChannels = async () => {
		if (!user) return;
		setLoading(true);
		const result = await getUserChannelsAction(user.username);
		if (result.success && result.data) {
			setChannels(result.data);
		}
		setLoading(false);
	};

	const loadMessages = async (channelId: number) => {
		if (!user) return;
		const result = await getMessagesAction(channelId, user.username);
		if (result.success && result.data) {
			setMessages(result.data);
		}
	};

	const loadMembers = async (channelId: number) => {
		if (!user) return;
		const result = await getChannelMembersAction(channelId, user.username);
		if (result.success && result.data) {
			setMembers(result.data);
		}
	};

	const handleSendMessage = async () => {
		if (!selectedChannel || !user || !newMessage.trim()) return;

		const result = await sendMessageAction(selectedChannel.id, newMessage, user.username);
		if (result.success) {
			setNewMessage('');
			await loadMessages(selectedChannel.id);
		}
	};

	const handleChannelSelect = async (channel: ChannelWithLastMessage) => {
		setSelectedChannel(channel);
		setSearchTerm(''); // Clear search when changing channel
		// Mark messages as read when selecting channel
		if (user) {
			const { markChannelMessagesAsRead } = await import('@/lib/chat/message-reads');
			await markChannelMessagesAsRead(channel.id, user.username);
			// Reload channels to update unread counts
			loadChannels();
		}
	};

	const handleCreateChannel = () => {
		setShowCreateDialog(true);
	};

	const handleShowMembers = async () => {
		if (selectedChannel) {
			await loadMembers(selectedChannel.id);
			setShowMembersDialog(true);
		}
	};

	const handleChannelCreated = () => {
		loadChannels();
		setShowCreateDialog(false);
	};

	const handleDeleteMessage = async (messageId: number) => {
		if (!user) return;

		if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
			return;
		}

		const result = await deleteMessageAction(messageId, user.username);
		if (result.success) {
			await loadMessages(selectedChannel!.id);
		}
	};

	const handleEditMessage = async (messageId: number, newContent: string) => {
		if (!user) return;

		const result = await editMessageAction(messageId, newContent, user.username);
		if (result.success) {
			setEditingMessage(null);
			await loadMessages(selectedChannel!.id);
		}
	};

	const handleDeleteChannel = async (channelId: number, channelName: string) => {
		if (!user) return;

		if (
			!confirm(
				`¿Estás seguro de que quieres eliminar el canal "${channelName}"? Esta acción eliminará todos los mensajes y miembros del canal.`
			)
		) {
			return;
		}

		const result = await deleteChannelAction(channelId, user.username);
		if (result.success) {
			if (selectedChannel?.id === channelId) {
				setSelectedChannel(null);
				setMessages([]);
			}
			loadChannels();
		} else {
			alert(result.error || 'Error al eliminar el canal');
		}
	};

	if (!user) {
		return <div className="p-4">Cargando...</div>;
	}

	return (
		<div className="flex h-[calc(100vh-2rem)] gap-4">
			{/* Channels Sidebar */}
			<Card className="w-80 flex flex-col">
				<div className="p-4 border-b">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold">Canales</h2>
						{user.role === 'Admin' && (
							<Button size="sm" onClick={handleCreateChannel}>
								<Plus className="h-4 w-4 mr-2" />
								Nuevo
							</Button>
						)}
					</div>
				</div>
				<ScrollArea className="flex-1">
					{loading ? (
						<div className="p-4 text-center text-sm text-muted-foreground">Cargando canales...</div>
					) : channels.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">No tienes canales</div>
					) : (
						<div className="p-2 space-y-1">
							{channels.map((channel) => (
								<div
									key={channel.id}
									className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
										selectedChannel?.id === channel.id
											? 'bg-primary text-primary-foreground'
											: 'hover:bg-muted'
									}`}
								>
									<button onClick={() => handleChannelSelect(channel)} className="flex-1 text-left">
										<div className="flex items-center justify-between">
											<div className="font-medium">{channel.name || 'Sin nombre'}</div>
											{channel.unread_count && channel.unread_count > 0 && (
												<div className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
													{channel.unread_count > 99 ? '99+' : channel.unread_count}
												</div>
											)}
										</div>
										{channel.description && (
											<div className="text-xs opacity-70 mt-1">{channel.description}</div>
										)}
									</button>
									{user.role === 'Admin' && (
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteChannel(channel.id, channel.name || 'Sin nombre');
											}}
											className="shrink-0"
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</Card>

			{/* Chat Area */}
			<Card className="flex-1 flex flex-col">
				{selectedChannel ? (
					<>
						{/* Chat Header */}
						<div className="p-4 border-b">
							{showSearch ? (
								<div className="flex items-center gap-2">
									<Input
										placeholder="Buscar mensajes..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										autoFocus
										className="flex-1"
									/>
									<Button size="sm" variant="ghost" onClick={() => setShowSearch(false)}>
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-lg font-semibold">
											{selectedChannel.name || 'Sin nombre'}
										</h2>
										{selectedChannel.description && (
											<p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
										)}
									</div>
									<div className="flex items-center gap-2">
										<Button size="sm" variant="outline" onClick={() => setShowSearch(true)}>
											<Search className="h-4 w-4" />
										</Button>
										<Button size="sm" variant="outline" onClick={handleShowMembers}>
											<Users className="h-4 w-4 mr-2" />
											Miembros
										</Button>
									</div>
								</div>
							)}
						</div>

						{/* Messages */}
						<ScrollArea className="flex-1 p-4 min-h-0">
							<div className="space-y-4">
								{filteredMessages.length === 0 ? (
									searchTerm ? (
										<div className="text-center text-muted-foreground py-8">
											<Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
											<p>No se encontraron mensajes que coincidan con "{searchTerm}"</p>
										</div>
									) : (
										<div className="text-center text-muted-foreground py-8">
											<MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
											<p>No hay mensajes en este canal</p>
										</div>
									)
								) : (
									filteredMessages.map((message) => (
										<div
											key={message.id}
											className={`flex ${
												message.user_id === user.username ? 'justify-end' : 'justify-start'
											}`}
										>
											<div
												className={`max-w-[70%] rounded-lg p-3 ${
													message.user_id === user.username
														? 'bg-primary text-primary-foreground'
														: 'bg-muted'
												}`}
											>
												{message.user_id !== user.username && (
													<div className="text-xs font-medium mb-1 opacity-70">
														{message.users?.username || 'Usuario'}
													</div>
												)}
												{message.is_deleted ? (
													<div className="text-sm italic opacity-70">
														Este mensaje fue eliminado
													</div>
												) : editingMessage?.id === message.id ? (
													<div className="flex gap-2">
														<Input
															value={editingMessage.content}
															onChange={(e) =>
																setEditingMessage({ id: message.id, content: e.target.value })
															}
															onKeyDown={(e) => {
																if (e.key === 'Enter' && !e.shiftKey) {
																	e.preventDefault();
																	handleEditMessage(message.id, editingMessage.content);
																} else if (e.key === 'Escape') {
																	setEditingMessage(null);
																}
															}}
															autoFocus
															className="flex-1"
														/>
														<Button
															size="sm"
															onClick={() => handleEditMessage(message.id, editingMessage.content)}
														>
															Guardar
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => setEditingMessage(null)}
														>
															Cancelar
														</Button>
													</div>
												) : (
													<div className="text-sm">{message.content}</div>
												)}
												<div className="text-xs mt-1 opacity-70 flex items-center justify-between gap-2">
													<span>
														{new Date(message.created_at).toLocaleTimeString('es-AR', {
															hour: '2-digit',
															minute: '2-digit',
														})}
														{message.edited_at && ' (editado)'}
													</span>
													{message.user_id === user.username && !message.is_deleted && (
														<div className="flex gap-1">
															<button
																onClick={() =>
																	setEditingMessage({
																		id: message.id,
																		content: message.content || '',
																	})
																}
																className="hover:opacity-100 opacity-50"
															>
																<Edit2 className="h-3 w-3" />
															</button>
															<button
																onClick={() => handleDeleteMessage(message.id)}
																className="hover:opacity-100 opacity-50"
															>
																<Trash2 className="h-3 w-3" />
															</button>
														</div>
													)}
												</div>
											</div>
										</div>
									))
								)}
								{searchTerm && filteredMessages.length > 0 && (
									<div className="text-center text-sm text-muted-foreground py-2">
										{filteredMessages.length}{' '}
										{filteredMessages.length === 1 ? 'mensaje encontrado' : 'mensajes encontrados'}
									</div>
								)}
							</div>
						</ScrollArea>

						{/* Message Input */}
						<div className="p-4 border-t">
							<div className="flex gap-2">
								<Input
									placeholder="Escribe un mensaje..."
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
								/>
								<Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
							<p>Selecciona un canal para comenzar a chatear</p>
						</div>
					</div>
				)}
			</Card>

			{/* Create Channel Dialog */}
			{showCreateDialog && (
				<CreateChannelDialog
					open={showCreateDialog}
					onOpenChange={setShowCreateDialog}
					onChannelCreated={handleChannelCreated}
				/>
			)}

			{/* Channel Members Dialog */}
			{showMembersDialog && (
				<ChannelMembersDialog
					open={showMembersDialog}
					onOpenChange={setShowMembersDialog}
					channel={selectedChannel}
					members={members}
					onMembersUpdated={() => {
						if (selectedChannel) {
							loadMembers(selectedChannel.id);
						}
					}}
					currentUsername={user.username}
					currentUserRole={user.role}
				/>
			)}
		</div>
	);
}
