CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,
	user_name varchar(50),
	email varchar(100),
	password varchar(255),
	bio varchar(1000),
	profile_picture varchar(255)
);

CREATE TABLE fandoms(
	fandom_id SERIAL PRIMARY KEY,
	fandom_name varchar(50)
);


ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO group_project;

ALTER TABLE users
ADD COLUMN 	display_name varchar(20);

CREATE TABLE user_fandom(
	id SERIAL PRIMARY KEY,
	user_id int,
	fandom_id int,
	FOREIGN KEY (user_id) REFERENCES users(user_id),
	FOREIGN KEY (fandom_id) REFERENCES fandoms(fandom_id)
);

CREATE TABLE relationships(
	id SERIAL PRIMARY KEY,
	user_follow int,
	user_followed int,
	timestamp timestamp DEFAULT NOW(),
	FOREIGN key(user_follow) REFERENCES users(user_id),
	FOREIGN KEY(user_followed) REFERENCES users(user_id)
);

CREATE TABLE contents(
	content_id SERIAL PRIMARY KEY,
	content_name varchar(20),
	content_branch varchar(20)
);

CREATE TABLE moderators(
	mod_id serial PRIMARY KEY,
	user_id int,
	fandom_id int,
	assigned_at timestamp,
	FOREIGN KEY(user_id) REFERENCES users(user_id),
	FOREIGN KEY(fandom_id) REFERENCES fandoms(fandom_id)
);


CREATE TYPE post_type_enum AS ENUM ('normal', 'poll');


CREATE TABLE posts(
	post_id serial PRIMARY KEY,
	user_id int,
	fandom_id int,
	content_id int,
	post_type post_type_enum NOT NULL DEFAULT 'normal',
	parent_id int,
	caption varchar(2000),
	created_at timestamp NOT NULL DEFAULT NOW(),
	FOREIGN KEY(user_id) REFERENCES users(user_id),
	FOREIGN KEY(fandom_id) REFERENCES fandoms(fandom_id),
	FOREIGN KEY(content_id) REFERENCES contents(content_id),
	FOREIGN KEY(parent_id) REFERENCES posts(post_id)
);

CREATE TABLE hashtags(
	id serial PRIMARY KEY,
	hashtag_name varchar(50)
);

CREATE TABLE hashtag_post(
	id serial PRIMARY KEY,
	hashtag_id int,
	post_id int,
	FOREIGN KEY(hashtag_id) REFERENCES hashtags(id),
	FOREIGN KEY(post_id) REFERENCES posts(post_id)
);

CREATE TABLE media(
	media_id serial PRIMARY KEY,
	file_url text,
	media_type text
);

CREATE TABLE post_media(
	id serial PRIMARY KEY,
	post_id int,
	media_id int,
	FOREIGN KEY(post_id) REFERENCES posts(post_id),
	FOREIGN KEY(media_id) REFERENCES media(media_id)
);

CREATE TABLE likes(
	id serial PRIMARY KEY,
	user_id int,
	post_id int,
	time timestamp NOT NULL DEFAULT NOW(),
	FOREIGN KEY(user_id) REFERENCES users(user_id),
	FOREIGN KEY(post_id) REFERENCES posts(post_id)
);


CREATE TABLE pollS(
	poll_id serial PRIMARY KEY,
	post_id int,
	question text,
	FOREIGN KEY(post_id) REFERENCES posts(post_id)
);

CREATE TABLE poll_options(
	option_id serial PRIMARY KEY,
	poll_id int,
	option_text varchar(100),
	FOREIGN KEY(poll_id) REFERENCES polls(poll_id)
);

CREATE TABLE poll_votes(
	id serial PRIMARY KEY,
	poll_option_id int,
	user_id int,
	FOREIGN KEY(poll_option_id) REFERENCES poll_options(option_id)
);

