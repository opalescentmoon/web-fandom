CREATE TABLE categories(
id serial PRIMARY KEY ,
category varchar(255));

--kolom baru buat fandoms
ALTER TABLE fandoms
ADD COLUMN category_id int;

--fk
ALTER TABLE fandoms
ADD CONSTRAINT fk_fandom_cat
FOREIGN KEY(category_id) REFERENCES categories(id);

--masukin data ke content
INSERT INTO contents(content_name, content_branch )
VALUES('Fanwork', 'Fanart'),
	('Fanwork', 'Fanfic'),
	('Fanwork', 'Fanmerch'),
	('Official', 'Announcement'),
	('Official', 'Lore'),
	('Official', 'Worldbuilding'),
	('Forum', 'Discussion'),
	('Forum', 'Polls');

INSERT INTO contents(content_name, content_branch)
VALUES ('Forum', 'QnA');

INSERT INTO categories(category)
VALUES('Anime & Manga'),
	('Books & Literatures'),
	('Cartoon & Comics'),
	('Movies'),
	('Musics'),
	('TV Shows'),
	('Video Games'),
	('Other Media');


CREATE TABLE chats (
    chat_id SERIAL PRIMARY KEY,
    chat_type VARCHAR(10) NOT NULL CHECK (chat_type IN ('dm', 'group')),
    chat_name VARCHAR(255), --bwt gc
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INT,  
    user_id INT,
    joined_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    chat_id INT,
    sender_id INT,
    message_text TEXT,
    media_id INT,  
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
    FOREIGN KEY(sender_id) REFERENCES users(user_id),
    FOREIGN KEY (media_id) REFERENCES media(media_id)
);

ALTER TABLE messages 
ADD COLUMN edited_at TIMESTAMP,      -- message edited
ADD COLUMN deleted_at TIMESTAMP;

CREATE TABLE message_status (
    id SERIAL PRIMARY KEY,
    message_id INT,
    user_id INT,
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP DEFAULT NOW(), --centang satu
    delivered_at TIMESTAMP,           --centang dua
    read_at TIMESTAMP,                --centang biru
    failed_at TIMESTAMP,              
    retry_count INT DEFAULT 0,
    FOREIGN KEY (message_id) REFERENCES messages(message_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE wiki_pages(
	id SERIAL PRIMARY KEY,
	fandom_id INT,
	content_id INT,
	title TEXT,
	content TEXT,
	created_by INT,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW(),
	approved_by INT,
	FOREIGN KEY (fandom_id) REFERENCES fandoms(fandom_id),
	FOREIGN KEY (content_id) REFERENCES contents(content_id),
	FOREIGN KEY (created_by) REFERENCES users(user_id),
	FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE TYPE wiki_status_type_enum AS ENUM('pending', 'approved', 'rejected');

CREATE TABLE wiki_edits(
	id SERIAL PRIMARY KEY,
	page_id INT,
	editor_id INT,
	content TEXT,
	status wiki_status_type_enum,
	reviewed_by INT,
	reviewed_at timestamp,
	created_at timestamp DEFAULT NOW(),
	FOREIGN KEY (page_id) REFERENCES wiki_pages(id),
	FOREIGN KEY (editor_id) REFERENCES users (user_id),
	FOREIGN KEY (reviewed_by) REFERENCES users (user_id)
);


