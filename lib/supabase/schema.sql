-- Create the 'polls' table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    vote_count INT DEFAULT 0,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the 'poll_options' table
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    option_order INT NOT NULL,
    vote_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the 'votes' table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    poll_option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    voter_ip INET,
    voter_fingerprint VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(voter_fingerprint, poll_id) -- Prevent duplicate votes from the same fingerprint on the same poll
);


-- Function to increment poll option vote count
CREATE OR REPLACE FUNCTION increment_option_vote_count(option_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment poll vote count
CREATE OR REPLACE FUNCTION increment_poll_vote_count(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE polls
  SET vote_count = vote_count + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;


-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS for 'polls' table
-- Policy for users to view their own polls or public polls
CREATE POLICY "Allow authenticated users to view their own polls and all public polls."
ON polls FOR SELECT
USING (
  (auth.uid() = creator_id) OR (is_public = TRUE)
);

-- Policy for authenticated users to create polls
CREATE POLICY "Allow authenticated users to create polls."
ON polls FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL); -- creator_id will be set by the server action using auth.uid()

-- Policy for poll creators to update their own polls
CREATE POLICY "Allow poll creators to update their own polls."
ON polls FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Policy for poll creators to delete their own polls
CREATE POLICY "Allow poll creators to delete their own polls."
ON polls FOR DELETE
USING (auth.uid() = creator_id);


-- RLS for 'poll_options' table
-- Policy for users to view options of polls they can view
CREATE POLICY "Allow anyone to view poll options if they can view the parent poll."
ON poll_options FOR SELECT
USING (
  EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND ((auth.uid() = polls.creator_id) OR (polls.is_public = TRUE)))
);

-- Policy for poll creators to insert/update/delete options (managed by server actions)
-- Note: Direct client-side insert/update/delete is not expected, handled via server actions that verify creator_id on the parent poll.
-- These policies are permissive enough for the server actions, as the server actions themselves handle the authorization logic.
CREATE POLICY "Allow poll creators to manage options for their polls."
ON poll_options FOR ALL
USING (EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND auth.uid() = polls.creator_id))
WITH CHECK (EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND auth.uid() = polls.creator_id));


-- RLS for 'votes' table
-- Policy for anyone to insert a vote
CREATE POLICY "Allow anyone to cast a vote."
ON votes FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM polls WHERE polls.id = votes.poll_id AND polls.is_active = TRUE)
);

-- Policy for users to view their own votes. Aggregated counts are public via the options table.
CREATE POLICY "Allow authenticated users to view their own votes."
ON votes FOR SELECT
USING (auth.uid() = voter_id);

-- Optional: Prevent direct updates/deletes on votes by users, should be handled by specific functions/logic if needed.
-- CREATE POLICY "Deny direct updates on votes." ON votes FOR UPDATE USING (FALSE);
-- CREATE POLICY "Deny direct deletes on votes." ON votes FOR DELETE USING (FALSE);