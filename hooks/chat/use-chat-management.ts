import { useState, useEffect, useRef, useCallback } from 'react';
import { ChannelWithLastMessage, MessageWithUser } from '@/types/chat';
import { getUserChannelsAction, deleteChannelAction } from '@/actions/chat/channels';
import {
	sendMessageAction,
	deleteMessageAction,
	editMessageAction,
	cleanChannelMessagesAction,
} from '@/actions/chat/messages';
import { getChannelMembersAction } from '@/actions/chat/channel-members';
import { getSupabaseClient } from '@/lib/supabase-client';
import { SCROLL_DELAY } from '@/constants/chat/chat.constants';

interface UseChatManagementProps {
	currentUsername: string;
	currentUserRole: string;
	messages: MessageWithUser[];
	messagesLoading: boolean;
}

export function useChatManagement({
	currentUsername,
	currentUserRole,
	messages,
	messagesLoading,
}: UseChatManagementProps) {
	const [channels, setChannels] = useState<ChannelWithLastMessage[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<ChannelWithLastMessage | null>(null);
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
	const [showSidebar, setShowSidebar] = useState(true);
	const [showCleanupDialog, setShowCleanupDialog] = useState(false);
	const [cleanupDate, setCleanupDate] = useState('');
	const [sending, setSending] = useState(false);
	const messagesScrollRef = useRef<HTMLDivElement>(null);
	const [scrolledToUnread, setScrolledToUnread] = useState(false);

	const loadChannels = useCallback(async () => {
		if (!currentUsername) return;
		setLoading(true);
		const result = await getUserChannelsAction(currentUsername);
		if (result.success && result.data) {
			setChannels(result.data);
		}
		setLoading(false);
	}, [currentUsername]);

	const loadMembers = async (channelId: number) => {
		if (!currentUsername) return;
		const result = await getChannelMembersAction(channelId, currentUsername);
		if (result.success && result.data) {
			setMembers(result.data);
		}
	};

	const handleSendMessage = async (channelId: number) => {
		if (!channelId || !currentUsername || !newMessage.trim() || sending) return;

		setSending(true);
		const messageContent = newMessage.trim();
		setNewMessage('');

		const result = await sendMessageAction(channelId, messageContent, currentUsername);
		if (!result.success) {
			setNewMessage(messageContent);
		}
		setSending(false);
	};

	const handleChannelSelect = async (channel: ChannelWithLastMessage) => {
		setSelectedChannel(channel);
		setSearchTerm('');
		setShowSidebar(false);
		setScrolledToUnread(false);
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
		if (!currentUsername) return;

		if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
			return;
		}

		await deleteMessageAction(messageId, currentUsername);
	};

	const handleEditMessage = async (messageId: number, newContent: string) => {
		if (!currentUsername) return;

		const result = await editMessageAction(messageId, newContent, currentUsername);
		if (result.success) {
			setEditingMessage(null);
		}
	};

	const handleDeleteChannel = async (channelId: number, channelName: string) => {
		if (!currentUsername) return;

		if (
			!confirm(
				`¿Estás seguro de que quieres eliminar el canal "${channelName}"? Esta acción eliminará todos los mensajes y miembros del canal.`
			)
		) {
			return;
		}

		const result = await deleteChannelAction(channelId, currentUsername);
		if (result.success) {
			if (selectedChannel?.id === channelId) {
				setSelectedChannel(null);
			}
			loadChannels();
		} else {
			alert(result.error || 'Error al eliminar el canal');
		}
	};

	const handleCleanupMessages = async () => {
		if (!selectedChannel || !currentUsername || !cleanupDate) return;

		if (
			!confirm(
				`¿Estás seguro de que quieres eliminar todos los mensajes anteriores a ${new Date(
					cleanupDate
				).toLocaleDateString()}? Esta acción no se puede deshacer.`
			)
		) {
			return;
		}

		const result = await cleanChannelMessagesAction(
			selectedChannel.id,
			cleanupDate,
			currentUsername
		);
		if (result.success) {
			alert(`Se eliminaron ${result.deletedCount || 0} mensajes del canal.`);
			setShowCleanupDialog(false);
			setCleanupDate('');
		} else {
			alert(result.error || 'Error al limpiar mensajes del canal');
		}
	};

	// Realtime subscription for unread counts
	useEffect(() => {
		if (!currentUsername) return;

		const supabase = getSupabaseClient();

		const messagesChannel = supabase
			.channel('channels-unread')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
				},
				async (payload) => {
					const newMessage = payload.new as any;
					if (selectedChannel?.id !== newMessage.channel_id) {
						loadChannels();
					}
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'message_reads',
				},
				async () => {
					loadChannels();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(messagesChannel);
		};
	}, [currentUsername, selectedChannel?.id]);

	// Smart scroll to first unread message or bottom when channel is opened
	useEffect(() => {
		const scrollToUnreadOrBottom = async () => {
			if (!selectedChannel || !currentUsername || scrolledToUnread) {
				return;
			}

			try {
				const { data: readMessages } = await getSupabaseClient()
					.from('message_reads')
					.select('message_id')
					.eq('user_id', currentUsername);

				const readMessageIds = new Set(readMessages?.map((m: any) => m.message_id) || []);

				// Find first unread message
				const firstUnreadMessage = messages.find((msg) => !readMessageIds.has(msg.id));

				// Scroll to first unread message or bottom
				setTimeout(() => {
					const scrollArea = messagesScrollRef.current?.querySelector(
						'[data-radix-scroll-area-viewport]'
					);
					if (scrollArea) {
						if (firstUnreadMessage) {
							const messageElements = scrollArea.querySelectorAll('[data-message-id]');
							const targetElement = Array.from(messageElements).find(
								(el) => el.getAttribute('data-message-id') === String(firstUnreadMessage.id)
							);
							if (targetElement) {
								targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
							}
						} else {
							scrollArea.scrollTop = scrollArea.scrollHeight;
						}
					}
				}, SCROLL_DELAY);

				// Mark messages as read after scrolling
				if (selectedChannel) {
					const { markChannelMessagesAsRead } = await import('@/lib/chat/message-reads');
					await markChannelMessagesAsRead(selectedChannel.id, currentUsername);
					loadChannels();
				}

				setScrolledToUnread(true);
			} catch (error) {
				console.error('Error scrolling to unread messages:', error);
			}
		};

		scrollToUnreadOrBottom();
	}, [selectedChannel, messages, scrolledToUnread, currentUsername]);

	return {
		// State
		channels,
		selectedChannel,
		newMessage,
		loading,
		showCreateDialog,
		showMembersDialog,
		members,
		searchTerm,
		showSearch,
		editingMessage,
		showSidebar,
		showCleanupDialog,
		cleanupDate,
		sending,
		messagesScrollRef,
		scrolledToUnread,

		// Setters
		setNewMessage,
		setSearchTerm,
		setShowSearch,
		setEditingMessage,
		setShowSidebar,
		setShowCleanupDialog,
		setCleanupDate,
		setShowCreateDialog,
		setShowMembersDialog,
		setSelectedChannel,
		setChannels,

		// Actions
		loadChannels,
		loadMembers,
		handleSendMessage,
		handleChannelSelect,
		handleCreateChannel,
		handleShowMembers,
		handleChannelCreated,
		handleDeleteMessage,
		handleEditMessage,
		handleDeleteChannel,
		handleCleanupMessages,

		// Computed
		isAdmin: currentUserRole === 'Admin',
	};
}

// This is a placeholder for the messages state that will be passed from the parent component
// The actual messages state is managed by useChatRealtime hook
declare const messages: MessageWithUser[];
