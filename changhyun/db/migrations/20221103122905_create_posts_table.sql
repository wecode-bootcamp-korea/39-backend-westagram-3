-- migrate:up
CREATE TABLE posts (
id INT NOT NULL AUTO_INCREMENT,
title VARCHAR(100) NOT NULL,
content TEXT NULL,
image VARCHAR(1000) NULL,
user_id INT NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
PRIMARY KEY (id),
CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);

-- migrate:down
DROP TABLE posts;