export type Channel = {
	id: number;
	created_at?: string;
	name: string | null;
	description: string | null;
};

export type ChannelMember = {
	id: number;
	joined_at: string;
	user_id: string;
	channel_id: number;
};

export type Message = {
	id: number;
	created_at: string;
	content: string | null;
	edited_at: string | null;
	deleted_at: string | null;
	user_id: string;
	channel_id: number;
	is_deleted: boolean;
};

export type MessageWithUser = Message & {
	users?: {
		username: string | null;
		role: string | null;
	} | null;
};

export type ChannelWithMembers = Channel & {
	channel_members?: ChannelMember[];
};

export type ChannelWithLastMessage = Channel & {
	last_message?: string;
	last_message_at?: string;
	member_count?: number;
	unread_count?: number;
};
