-- migrate:up
CREATE TABLE users_password (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
-- migrate:down
DROP TABLE users_password;

