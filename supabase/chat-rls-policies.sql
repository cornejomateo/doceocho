-- Disable RLS on chat tables (security is handled in server actions)
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Drop the foreign key constraint to auth.users since we're using username
ALTER TABLE public.channel_members DROP CONSTRAINT IF EXISTS channel_members_user_id_fkey;

-- Change user_id from UUID to text to use username instead
ALTER TABLE public.channel_members ALTER COLUMN user_id TYPE text USING user_id::text;

-- Add foreign key to users.username
ALTER TABLE public.channel_members 
ADD CONSTRAINT channel_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(username) 
ON UPDATE CASCADE ON DELETE CASCADE;

-- Do the same for messages table
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.messages ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.messages 
ADD CONSTRAINT messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(username) 
ON UPDATE CASCADE ON DELETE CASCADE;

-- Add foreign key from messages to channels with CASCADE delete
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_channel_id_fkey;
ALTER TABLE public.messages 
ADD CONSTRAINT messages_channel_id_fkey 
FOREIGN KEY (channel_id) REFERENCES public.channels(id) 
ON UPDATE CASCADE ON DELETE CASCADE;

-- Add foreign key from channel_members to channels with CASCADE delete
ALTER TABLE public.channel_members 
DROP CONSTRAINT IF EXISTS channel_members_channel_id_fkey;
ALTER TABLE public.channel_members 
ADD CONSTRAINT channel_members_channel_id_fkey 
FOREIGN KEY (channel_id) REFERENCES public.channels(id) 
ON UPDATE CASCADE ON DELETE CASCADE;
