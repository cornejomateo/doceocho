'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { ChannelWithLastMessage } from '@/lib/chat/chat-types';
import { CHAT_CONSTANTS, MAX_UNREAD_DISPLAY } from '../../../constants/chat/chat.constants';

interface ChatSidebarProps {
	channels: ChannelWithLastMessage[];
	selectedChannel: ChannelWithLastMessage | null;
	loading: boolean;
	initialLoadDone: boolean;
	showSidebar: boolean;
	isAdmin: boolean;
	onChannelSelect: (channel: ChannelWithLastMessage) => void;
	onCreateChannel: () => void;
	onDeleteChannel: (channelId: number, channelName: string) => void;
	onCloseSidebar: () => void;
	pushNotificationSettings?: React.ReactNode;
}

export function ChatSidebar({
	channels,
	selectedChannel,
	loading,
	initialLoadDone,
	showSidebar,
	isAdmin,
	onChannelSelect,
	onCreateChannel,
	onDeleteChannel,
	onCloseSidebar,
	pushNotificationSettings,
}: ChatSidebarProps) {
	return (
		<>
			<Card
				className={`w-80 flex flex-col absolute md:relative z-10 h-full transition-transform overflow-hidden ${
					showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
				}`}
			>
				<div className="p-4 border-b">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold">{CHAT_CONSTANTS.CHANNELS.TITLE}</h2>
						{isAdmin && (
							<Button size="sm" onClick={onCreateChannel}>
								<Plus className="h-4 w-4 mr-2" />
								{CHAT_CONSTANTS.CHANNELS.NEW_CHANNEL}
							</Button>
						)}
					</div>
					{pushNotificationSettings}
				</div>
				<ScrollArea className="flex-1 h-0">
					{loading && !initialLoadDone ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							{CHAT_CONSTANTS.MESSAGES.LOADING_CHANNELS}
						</div>
					) : channels.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							{CHAT_CONSTANTS.MESSAGES.NO_CHANNELS}
						</div>
					) : (
						<div className="p-1.5 space-y-1">
							{channels.map((channel) => (
								<div
									key={channel.id}
									className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
										selectedChannel?.id === channel.id
											? 'bg-primary text-primary-foreground'
											: 'hover:bg-muted'
									}`}
								>
									<button onClick={() => onChannelSelect(channel)} className="flex-1 text-left">
										<div className="flex items-center justify-between">
											<div className="font-medium">
												{channel.name || CHAT_CONSTANTS.CHANNELS.NO_NAME}
											</div>
											{channel.unread_count && channel.unread_count > 0 && (
												<div className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
													{channel.unread_count > MAX_UNREAD_DISPLAY
														? `${MAX_UNREAD_DISPLAY}+`
														: channel.unread_count}
												</div>
											)}
										</div>
										{channel.description && (
											<div className="text-xs opacity-70 mt-1">{channel.description}</div>
										)}
									</button>
									{isAdmin && (
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.stopPropagation();
												onDeleteChannel(
													channel.id,
													channel.name || CHAT_CONSTANTS.CHANNELS.NO_NAME
												);
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

			{/* Mobile sidebar overlay */}
			{showSidebar && (
				<div className="fixed inset-0 bg-black/50 z-0 md:hidden" onClick={onCloseSidebar} />
			)}
		</>
	);
}
