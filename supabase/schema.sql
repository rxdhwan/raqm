-- Create tables for RAQM social media app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  plate_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  show_phone_number BOOLEAN DEFAULT FALSE,
  is_mulkiya_verified BOOLEAN DEFAULT FALSE,
  mulkiya_verified_at TIMESTAMP WITH TIME ZONE,
  mulkiya_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Follows table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Story views table
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat participants table
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'message'
  resource_id UUID, -- post_id, comment_id, etc.
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Car details table (for future expansion)
CREATE TABLE car_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  modifications TEXT,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (for future expansion)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event participants (for future expansion)
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL, -- 'going', 'interested', 'not_going'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Helper functions
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER AS $$
  BEGIN
    RETURN x + 1;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement(x INTEGER)
RETURNS INTEGER AS $$
  BEGIN
    RETURN x - 1;
  END;
$$ LANGUAGE plpgsql;

-- Create storage buckets
-- Run these in Supabase dashboard or via API
-- CREATE BUCKET IF NOT EXISTS 'avatars';
-- CREATE BUCKET IF NOT EXISTS 'post_images';
-- CREATE BUCKET IF NOT EXISTS 'story_images';
-- CREATE BUCKET IF NOT EXISTS 'mulkiya_verifications';
-- CREATE BUCKET IF NOT EXISTS 'car_images';
-- CREATE BUCKET IF NOT EXISTS 'event_images';

-- RLS Policies
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" 
ON posts FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" 
ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" 
ON comments FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" 
ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" 
ON likes FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" 
ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON likes FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" 
ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others" 
ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" 
ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Stories policies
CREATE POLICY "Stories are viewable by everyone" 
ON stories FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stories" 
ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON stories FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Story views are viewable by the story owner" 
ON story_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_views.story_id
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own story views" 
ON story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chats policies
CREATE POLICY "Users can view chats they are part of" 
ON chats FOR SELECT USING (
  auth.uid() = ANY(participant_ids)
);

CREATE POLICY "Users can insert chats they are part of" 
ON chats FOR INSERT WITH CHECK (
  auth.uid() = ANY(participant_ids)
);

CREATE POLICY "Users can update chats they are part of" 
ON chats FOR UPDATE USING (
  auth.uid() = ANY(participant_ids)
);

-- Chat participants policies
CREATE POLICY "Users can view chat participants for their chats" 
ON chat_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_participants.chat_id
    AND auth.uid() = ANY(chats.participant_ids)
  )
);

CREATE POLICY "Users can insert chat participants for their chats" 
ON chat_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_participants.chat_id
    AND auth.uid() = ANY(chats.participant_ids)
  )
);

-- Messages policies
CREATE POLICY "Users can view messages in their chats" 
ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND auth.uid() = ANY(chats.participant_ids)
  )
);

CREATE POLICY "Users can insert messages in their chats" 
ON messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND auth.uid() = ANY(chats.participant_ids)
  )
);

CREATE POLICY "Users can update message read status in their chats" 
ON messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND auth.uid() = ANY(chats.participant_ids)
  )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Car details policies
CREATE POLICY "Car details are viewable by everyone" 
ON car_details FOR SELECT USING (true);

CREATE POLICY "Users can insert their own car details" 
ON car_details FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own car details" 
ON car_details FOR UPDATE USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Events are viewable by everyone" 
ON events FOR SELECT USING (true);

CREATE POLICY "Users can insert their own events" 
ON events FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own events" 
ON events FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own events" 
ON events FOR DELETE USING (auth.uid() = creator_id);

-- Event participants policies
CREATE POLICY "Event participants are viewable by everyone" 
ON event_participants FOR SELECT USING (true);

CREATE POLICY "Users can insert their own event participation" 
ON event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event participation" 
ON event_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event participation" 
ON event_participants FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updating counts and timestamps

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comments_count = comments_count - 1
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
CREATE TRIGGER update_post_comment_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    
    -- Create notification for post owner
    IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
      INSERT INTO notifications (
        user_id,
        actor_id,
        type,
        resource_id,
        content
      ) VALUES (
        (SELECT user_id FROM posts WHERE id = NEW.post_id),
        NEW.user_id,
        'like',
        NEW.post_id,
        'liked your post'
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
    
    -- Remove notification
    DELETE FROM notifications
    WHERE actor_id = OLD.user_id
    AND resource_id = OLD.post_id
    AND type = 'like';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes
CREATE TRIGGER update_post_like_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();

-- Function to create comment notification
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for post owner if commenter is not post owner
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (
      user_id,
      actor_id,
      type,
      resource_id,
      content
    ) VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      NEW.user_id,
      'comment',
      NEW.post_id,
      'commented on your post'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment notifications
CREATE TRIGGER create_comment_notification_trigger
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

-- Function to create follow notification
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for followed user
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    resource_id,
    content
  ) VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    NEW.id,
    'started following you'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follow notifications
CREATE TRIGGER create_follow_notification_trigger
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

-- Function to update profile timestamps
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profile_timestamp_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_timestamp();

-- Function to update post timestamps
CREATE OR REPLACE FUNCTION update_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for posts
CREATE TRIGGER update_post_timestamp_trigger
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_timestamp();

-- Function to update chat timestamps
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chats
CREATE TRIGGER update_chat_timestamp_trigger
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_chat_timestamp();

-- Function to handle new message notifications
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update chat's updated_at timestamp
  UPDATE chats
  SET updated_at = NOW()
  WHERE id = NEW.chat_id;
  
  -- Create notification for all chat participants except sender
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    resource_id,
    content
  )
  SELECT 
    cp.user_id,
    NEW.user_id,
    'message',
    NEW.chat_id,
    'sent you a message'
  FROM chat_participants cp
  WHERE cp.chat_id = NEW.chat_id
  AND cp.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new messages
CREATE TRIGGER handle_new_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION handle_new_message();

-- Function to delete expired stories
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM stories
  WHERE expires_at < NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run every hour
-- This would typically be set up in the Supabase dashboard or via API
-- SELECT cron.schedule('0 * * * *', 'SELECT delete_expired_stories()');

-- Function to update car details timestamps
CREATE OR REPLACE FUNCTION update_car_details_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for car_details
CREATE TRIGGER update_car_details_timestamp_trigger
BEFORE UPDATE ON car_details
FOR EACH ROW
EXECUTE FUNCTION update_car_details_timestamp();

-- Function to update event timestamps
CREATE OR REPLACE FUNCTION update_event_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events
CREATE TRIGGER update_event_timestamp_trigger
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_event_timestamp();

-- Function to update event participant timestamps
CREATE OR REPLACE FUNCTION update_event_participant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event_participants
CREATE TRIGGER update_event_participant_timestamp_trigger
BEFORE UPDATE ON event_participants
FOR EACH ROW
EXECUTE FUNCTION update_event_participant_timestamp();

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_user_id ON story_views(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_car_details_user_id ON car_details(user_id);
CREATE INDEX idx_events_creator_id ON events(creator_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX idx_profiles_plate_number ON profiles(plate_number);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- Create text search capabilities
ALTER TABLE profiles ADD COLUMN search_vector tsvector;
CREATE INDEX profiles_search_idx ON profiles USING GIN (search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION profiles_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', coalesce(NEW.plate_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.full_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector updates
CREATE TRIGGER profiles_search_update_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION profiles_search_update();

-- Update existing profiles with search vector
UPDATE profiles SET search_vector = 
  setweight(to_tsvector('english', coalesce(plate_number, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(full_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'C');
