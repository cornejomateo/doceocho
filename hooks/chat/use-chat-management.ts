import { useState, useEffect, useRef, useCallback } from 'react';
import { ChannelWithLastMessage, MessageWithUser } from '@/lib/chat/chat-types';
import { getUserChannelsAction, deleteChannelAction } from '@/actions/chat/channels';
import {
	sendMessageAction,
	deleteMessageAction,
	editMessageAction,
	cleanChannelMessagesAction,
} from '@/actions/chat/messages';
import { getChannelMembersAction } from '@/actions/chat/channel-members';
import { SCROLL_DELAY } from '@/constants/chat/chat.constants';
import { updateLastReadMessage } from '@/lib/chat/channel-members';

interface UseChatManagementProps {
	currentUserUid: string;
	currentUserRole: string;
	messages: MessageWithUser[];
	messagesLoading: boolean;
}

export function useChatManagement({
	currentUserUid,
	currentUserRole,
	messages,
}: UseChatManagementProps) {
	const [channels, setChannels] = useState<ChannelWithLastMessage[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<ChannelWithLastMessage | null>(null);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [initialLoadDone, setInitialLoadDone] = useState(false);
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
	const [replyingTo, setReplyingTo] = useState<MessageWithUser | null>(null);

	const totalUnreadCount = channels.reduce((sum, ch) => sum + (ch.unread_count || 0), 0);

	const loadChannels = useCallback(
		async (isBackgroundUpdate = false) => {
			try {
				if (!currentUserUid) {
					if (!isBackgroundUpdate) {
						setLoading(false);
						setInitialLoadDone(true);
					}
					return;
				}
				if (!isBackgroundUpdate) {
					setLoading(true);
				}
				const result = await getUserChannelsAction(currentUserUid);
				if (result.success && result.data) {
					setChannels(result.data);
				}
			} finally {
				if (!isBackgroundUpdate) {
					setLoading(false);
					setInitialLoadDone(true);
				}
			}
		},
		[currentUserUid]
	);

	const loadMembers = async (channelId: number) => {
		if (!currentUserUid) return;
		const result = await getChannelMembersAction(channelId);
		if (result.success && result.data) {
			setMembers(result.data);
		}
	};

	const handleSendMessage = async (channelId: number) => {
		if (!channelId || !currentUserUid || !newMessage.trim() || sending) return;

		setSending(true);

		const messageContent = newMessage.trim();
		setNewMessage('');

		try {
			const result = await sendMessageAction(
				channelId,
				messageContent,
				currentUserUid,
				replyingTo?.id
			);

			if (!result.success) {
				setNewMessage(messageContent);
				return;
			}

			setReplyingTo(null);

			if (result.data) {
				window.dispatchEvent(new CustomEvent('new-message', { detail: result.data }));
			}

			setTimeout(() => {
				const scrollArea = messagesScrollRef.current?.querySelector(
					'[data-radix-scroll-area-viewport]'
				);
				if (scrollArea) {
					scrollArea.scrollTop = scrollArea.scrollHeight;
				}
			}, 50);
		} finally {
			setSending(false);
		}
	};

	const handleChannelSelect = async (channel: ChannelWithLastMessage) => {
		setSelectedChannel(channel);

		if (channel.last_message_id) {
			await updateLastReadMessage(channel.last_message_id, channel.id, currentUserUid);
		}

		setSearchTerm('');
		setShowSidebar(false);
		setScrolledToUnread(false);
		setReplyingTo(null);
	};

	const handleReplyTo = (message: MessageWithUser) => {
		setReplyingTo(message);
	};

	const handleCancelReply = () => {
		setReplyingTo(null);
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
		if (!currentUserUid) return;

		if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
			return;
		}

		await deleteMessageAction(messageId, currentUserUid);
	};

	const handleEditMessage = async (messageId: number, newContent: string) => {
		if (!currentUserUid) return;

		const result = await editMessageAction(messageId, newContent, currentUserUid);
		if (result.success) {
			setEditingMessage(null);
		}
	};

	const handleDeleteChannel = async (channelId: number, channelName: string) => {
		if (!currentUserUid) return;

		if (
			!confirm(
				`¿Estás seguro de que quieres eliminar el canal "${channelName}"? Esta acción eliminará todos los mensajes y miembros del canal.`
			)
		) {
			return;
		}

		const result = await deleteChannelAction(channelId, currentUserUid);
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
		if (!selectedChannel || !currentUserUid || !cleanupDate) return;

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
			currentUserUid
		);
		if (result.success) {
			alert(`Se eliminaron ${result.deletedCount || 0} mensajes del canal.`);
			setShowCleanupDialog(false);
			setCleanupDate('');
		} else {
			alert(result.error || 'Error al limpiar mensajes del canal');
		}
	};

	useEffect(() => {
		if (!selectedChannel || !currentUserUid) return;
		if (!selectedChannel.last_message_id) return;

		void updateLastReadMessage(selectedChannel.last_message_id, selectedChannel.id, currentUserUid);

		setChannels((prev) =>
			prev.map((ch) => (ch.id === selectedChannel.id ? { ...ch, unread_count: 0 } : ch))
		);
	}, [selectedChannel, currentUserUid]);

	useEffect(() => {
		if (!selectedChannel || !messages.length) return;

		const timeout = setTimeout(() => {
			const scrollArea = messagesScrollRef.current?.querySelector(
				'[data-radix-scroll-area-viewport]'
			);

			if (!scrollArea) return;

			// siempre scroll al final (simple y correcto para tu modelo actual)
			scrollArea.scrollTop = scrollArea.scrollHeight;
		}, SCROLL_DELAY);

		return () => clearTimeout(timeout);
	}, [selectedChannel, messages]);

	return {
		// State
		channels,
		selectedChannel,
		newMessage,
		loading,
		initialLoadDone,
		totalUnreadCount,
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
		replyingTo,

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
		handleReplyTo,
		handleCancelReply,

		// Computed
		isAdmin: currentUserRole === 'Admin',
	};
}

// This is a placeholder for the messages state that will be passed from the parent component
// The actual messages state is managed by useChatRealtime hook
declare const messages: MessageWithUser[];
