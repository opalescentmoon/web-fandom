ALTER TABLE users
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

CREATE TABLE auth_access_tokens (
    id SERIAL PRIMARY KEY,
    tokenable_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    name VARCHAR(100),
    hash VARCHAR(255) NOT NULL,
    abilities TEXT,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    expires_at TIMESTAMP
);

ALTER TABLE fandoms
ADD COLUMN thumbnail_media_id INT;

ALTER TABLE fandoms
ADD CONSTRAINT fk_fandom_media
FOREIGN KEY(thumbnail_media_id) REFERENCES media(media_id);

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO group_project;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO group_project;

ALTER TABLE polls
ADD CONSTRAINT unique_post_poll UNIQUE(post_id);

ALTER TABLE poll_votes
ADD CONSTRAINT unique_user_vote UNIQUE(user_id, poll_option_id);

ALTER TABLE likes
ADD CONSTRAINT unique_user_post UNIQUE(user_id, post_id);

ALTER TABLE relationships
ADD CONSTRAINT unique_user_user UNIQUE(user_follow, user_followed);

ALTER TABLE moderators
ADD CONSTRAINT unique_user_fandom UNIQUE(user_id, fandom_id);

ALTER TABLE hashtag_post
ADD CONSTRAINT unique_hashtag_post UNIQUE(hashtag_id, post_id);

ALTER TABLE user_fandom
ADD CONSTRAINT unique_user_fandom_combo UNIQUE(user_id, fandom_id);

ALTER TABLE chat_members
ADD CONSTRAINT unique_chat_user UNIQUE(chat_id, user_id);

