'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { CHAT_CONSTANTS } from '../../../constants/chat/chat.constants';

interface MessageInputProps {
	newMessage: string;
	sending: boolean;
	onMessageChange: (value: string) => void;
	onSendMessage: () => void;
}

export function MessageInput({
	newMessage,
	sending,
	onMessageChange,
	onSendMessage,
}: MessageInputProps) {
	return (
		<div className="p-3 border-t">
			<div className="flex gap-2">
				<Input
					placeholder={CHAT_CONSTANTS.MESSAGES.INPUT_PLACEHOLDER}
					value={newMessage}
					onChange={(e) => onMessageChange(e.target.value)}
					onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
				/>
				<Button onClick={onSendMessage} disabled={!newMessage.trim() || sending}>
					<Send className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
