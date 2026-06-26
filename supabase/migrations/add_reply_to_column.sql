-- Add reply_to column to messages table
ALTER TABLE public.messages 
ADD COLUMN reply_to bigint NULL;

-- Add foreign key constraint to reference messages table
ALTER TABLE public.messages 
ADD CONSTRAINT messages_reply_to_fkey 
FOREIGN KEY (reply_to) REFERENCES public.messages(id) ON DELETE SET NULL;
