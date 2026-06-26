'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/components/provider/auth-provider';
import { useChatRealtime } from '@/hooks/chat/use-chat-realtime';
import { usePushNotifications } from '@/hooks/push/use-push-notifications';
import { useChatManagement } from '@/hooks/chat/use-chat-management';
import { ChatSidebar } from './chat-sidebar';
import { ChatHeader } from './chat-header';
import { MessagesList } from './messages-list';
import { MessageInput } from './message-input';
import { PushNotificationSettings } from './push-notification-settings';
import { CleanupMessagesDialog } from './cleanup-messages-dialog';
import { CreateChannelDialog } from './create-channel-dialog';
import { ChannelMembersDialog } from './channel-members-dialog';
import { CHAT_CONSTANTS } from '../../../constants/chat/chat.constants';

export function ChatManagement() {
	const { user } = useAuth();
	const {
		isSupported: pushSupported,
		permission: pushPermission,
		subscription: pushSubscription,
		requestPermission,
		subscribe,
		unsubscribe,
	} = usePushNotifications();

	const chatManagement = useChatManagement({
		currentUsername: user?.username || '',
		currentUserRole: user?.role || '',
		messages: [],
		messagesLoading: false,
	});

	const { messages, loading: messagesLoading } = useChatRealtime(
		chatManagement.selectedChannel?.id || null
	);

	const filteredMessages = chatManagement.searchTerm
		? messages.filter(
				(msg) =>
					msg.content?.toLowerCase().includes(chatManagement.searchTerm.toLowerCase()) ||
					msg.users?.username?.toLowerCase().includes(chatManagement.searchTerm.toLowerCase())
			)
		: messages;

	useEffect(() => {
		if (user) {
			chatManagement.loadChannels();
		}
	}, [user, chatManagement.loadChannels]);

	if (!user) {
		return <div className="p-4">Cargando...</div>;
	}

	return (
		<div className="flex h-full gap-4 relative overflow-hidden">
			<ChatSidebar
				channels={chatManagement.channels}
				selectedChannel={chatManagement.selectedChannel}
				loading={chatManagement.loading}
				initialLoadDone={chatManagement.initialLoadDone}
				showSidebar={chatManagement.showSidebar}
				isAdmin={chatManagement.isAdmin}
				onChannelSelect={chatManagement.handleChannelSelect}
				onCreateChannel={chatManagement.handleCreateChannel}
				onDeleteChannel={chatManagement.handleDeleteChannel}
				onCloseSidebar={() => chatManagement.setShowSidebar(false)}
				pushNotificationSettings={
					pushSupported ? (
						<PushNotificationSettings
							isSupported={pushSupported}
							permission={pushPermission}
							subscription={pushSubscription}
							onRequestPermission={requestPermission}
							onSubscribe={subscribe}
							onUnsubscribe={unsubscribe}
						/>
					) : undefined
				}
			/>

			<Card className="flex-1 flex flex-col">
				{chatManagement.selectedChannel ? (
					<>
						<ChatHeader
							channel={chatManagement.selectedChannel}
							showSearch={chatManagement.showSearch}
							searchTerm={chatManagement.searchTerm}
							isAdmin={chatManagement.isAdmin}
							isMobile={false}
							onSearchToggle={() => chatManagement.setShowSearch(!chatManagement.showSearch)}
							onSearchChange={chatManagement.setSearchTerm}
							onShowMembers={chatManagement.handleShowMembers}
							onCleanupMessages={() => chatManagement.setShowCleanupDialog(true)}
							onBack={() => {
								chatManagement.setSelectedChannel(null);
								chatManagement.setShowSidebar(true);
							}}
						/>

						<MessagesList
							messages={messages}
							filteredMessages={filteredMessages}
							searchTerm={chatManagement.searchTerm}
							currentUsername={user.username}
							editingMessage={chatManagement.editingMessage}
							messagesScrollRef={chatManagement.messagesScrollRef}
							onEditMessage={chatManagement.handleEditMessage}
							onDeleteMessage={chatManagement.handleDeleteMessage}
							onSetEditingMessage={chatManagement.setEditingMessage}
							onReplyTo={chatManagement.handleReplyTo}
						/>

						<MessageInput
							newMessage={chatManagement.newMessage}
							sending={chatManagement.sending}
							replyingTo={chatManagement.replyingTo}
							onMessageChange={chatManagement.setNewMessage}
							onSendMessage={() =>
								chatManagement.selectedChannel &&
								chatManagement.handleSendMessage(chatManagement.selectedChannel.id)
							}
							onCancelReply={chatManagement.handleCancelReply}
						/>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
							<p>{CHAT_CONSTANTS.MESSAGES.SELECT_CHANNEL}</p>
						</div>
					</div>
				)}
			</Card>

			{chatManagement.showCreateDialog && (
				<CreateChannelDialog
					open={chatManagement.showCreateDialog}
					onOpenChange={chatManagement.setShowCreateDialog}
					onChannelCreated={chatManagement.handleChannelCreated}
				/>
			)}

			{chatManagement.showMembersDialog && (
				<ChannelMembersDialog
					open={chatManagement.showMembersDialog}
					onOpenChange={chatManagement.setShowMembersDialog}
					channel={chatManagement.selectedChannel}
					members={chatManagement.members}
					onMembersUpdated={() => {
						if (chatManagement.selectedChannel) {
							chatManagement.loadMembers(chatManagement.selectedChannel.id);
						}
					}}
					currentUsername={user.username}
					currentUserRole={user.role}
				/>
			)}

			<CleanupMessagesDialog
				open={chatManagement.showCleanupDialog}
				onOpenChange={chatManagement.setShowCleanupDialog}
				cleanupDate={chatManagement.cleanupDate}
				onCleanupDateChange={chatManagement.setCleanupDate}
				onCleanup={chatManagement.handleCleanupMessages}
			/>
		</div>
	);
}
