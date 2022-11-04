-- migrate:up
CREATE TABLE users_signup (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email_id INT NOT NULL,
    password_id INT NOT NULL
    CONSTRAINT user_signup_email_id_fkey FOREIGN KEY (email_id) REFERENCES users_email(id),
    CONSTRAINT user_signup_password_id_fkey FOREIGN KEY (password_id) REFERENCES users_password(id)
);
-- migrate:down
DROP TABLE users_signup;
