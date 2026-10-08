-- ==========================================================
-- NEWS PORTAL - CURRENT DATABASE SETUP
-- Generated against the current entities in the repository.
-- Default password for all seeded users: 123456
--
-- IMPORTANT:
-- 1. Stop all NewsPortal Spring Boot services before running this.
-- 2. This script resets the six application databases.
-- 3. The article DB is news_articles_db (plural), matching
--    article-service/application.properties.
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================================
-- 1. AUTH SERVICE
-- ==========================================================
DROP DATABASE IF EXISTS news_auth_db;
CREATE DATABASE news_auth_db;
USE news_auth_db;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ROLE_USER', 'ROLE_EDITOR', 'ROLE_ADMIN') NOT NULL,
    status ENUM('PENDING', 'REJECTED', 'APPROVED') NOT NULL DEFAULT 'PENDING'
);

-- BCrypt hash for: 123456
INSERT INTO users (id, username, email, password, role, status) VALUES
(1, 'jayantha', 'jayanthvvo395@gmail.com', '$2a$10$gueWh3apSWeF1GsBLjRr5uimogQuyhM070aPYZVu.MwfKKlYxLnxC', 'ROLE_ADMIN', 'APPROVED'),
(2, 'jayanthe', 'jayanthe@newsportal.com', '$2a$10$gueWh3apSWeF1GsBLjRr5uimogQuyhM070aPYZVu.MwfKKlYxLnxC', 'ROLE_EDITOR', 'APPROVED'),
(3, 'jayanthn', 'jayanthn@newsportal.com', '$2a$10$gueWh3apSWeF1GsBLjRr5uimogQuyhM070aPYZVu.MwfKKlYxLnxC', 'ROLE_USER', 'APPROVED');

CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    otp VARCHAR(255) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) NULL,
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================================================
-- 2. CATEGORY SERVICE
-- ==========================================================
DROP DATABASE IF EXISTS news_category_db;
CREATE DATABASE news_category_db;
USE news_category_db;

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO categories (id, name, description) VALUES
(1, 'Technology', 'Latest technology, software and development news'),
(2, 'Sports', 'Sports news, scores, records and analysis'),
(3, 'Education', 'Education, universities, learning and examinations'),
(4, 'Business', 'Business, startups, markets and economy'),
(5, 'Entertainment', 'Movies, music, television and celebrity news'),
(6, 'AI', 'Artificial intelligence, machine learning and GenAI'),
(7, 'Politics', 'Political news, government and public affairs'),
(8, 'Health', 'Health, fitness and wellness news');

-- ==========================================================
-- 3. USER SERVICE
-- ==========================================================
DROP DATABASE IF EXISTS news_user_db;
CREATE DATABASE news_user_db;
USE news_user_db;

CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    bio VARCHAR(500),
    avatar_url VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL
);

INSERT INTO user_profiles
(id, username, email, first_name, last_name, bio, avatar_url, created_at, updated_at)
VALUES
(1, 'jayantha', 'jayanthvvo395@gmail.com',
 'Jayantha', 'V',
 'Administrator of NewsPortal.', NULL,
 '2026-10-08 10:00:00.000000', '2026-10-08 10:00:00.000000'),

(2, 'jayanthe', 'jayanthe@newsportal.com',
 'Jayanthe', 'V',
 'News editor and technology enthusiast.', NULL,
 '2026-10-08 10:01:00.000000', '2026-10-08 10:01:00.000000'),

(3, 'jayanthn', 'jayanthn@newsportal.com',
 'Jayanth', 'N',
 'NewsPortal reader and community member.', NULL,
 '2026-10-08 10:02:00.000000', '2026-10-08 10:02:00.000000');

-- ==========================================================
-- 4. ARTICLE SERVICE
-- ==========================================================
DROP DATABASE IF EXISTS news_articles_db;
CREATE DATABASE news_articles_db;
USE news_articles_db;

CREATE TABLE articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_username VARCHAR(255) NOT NULL,
    category_id BIGINT NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'REVIEW') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0
);

INSERT INTO articles
(id, title, content, author_username, category_id, status, created_at, updated_at, view_count)
VALUES
(1,
 'Spring Boot Microservices Architecture',
 'A practical overview of Eureka, API Gateway, OpenFeign and service-to-service communication in Spring Boot.',
 'jayanthe', 1, 'PUBLISHED',
 '2026-09-20 10:00:00.000000', '2026-09-20 10:00:00.000000', 24),

(2,
 'Getting Started with Generative AI',
 'An introduction to large language models, prompting, embeddings, RAG and practical GenAI applications.',
 'jayanthe', 6, 'PUBLISHED',
 '2026-09-21 11:30:00.000000', '2026-09-21 11:30:00.000000', 31),

(3,
 'India Prepares for a Major Cricket Series',
 'A preview of the upcoming cricket series, key players and important storylines to follow.',
 'jayanthn', 2, 'PUBLISHED',
 '2026-09-22 09:15:00.000000', '2026-09-22 09:15:00.000000', 18),

(4,
 'How Developers Can Build Better APIs',
 'A guide to REST API design, validation, authentication, pagination and error handling.',
 'jayantha', 1, 'PUBLISHED',
 '2026-09-23 14:20:00.000000', '2026-09-23 14:20:00.000000', 15),

(5,
 'The Future of Online Education',
 'How digital learning platforms, interactive tools and AI assistants are changing education.',
 'jayanthn', 3, 'PUBLISHED',
 '2026-09-24 16:00:00.000000', '2026-09-24 16:00:00.000000', 12),

(6,
 'AI Agents and Tool Calling',
 'An overview of AI agents, tools, agent loops and how language models can interact with external systems.',
 'jayantha', 6, 'PUBLISHED',
 '2026-09-25 13:45:00.000000', '2026-09-25 13:45:00.000000', 42),

(7,
 'Building a Secure JWT Authentication Flow',
 'Understanding access tokens, authentication filters, roles and authorization in a Spring Boot application.',
 'jayanthe', 1, 'PUBLISHED',
 '2026-09-26 12:10:00.000000', '2026-09-26 12:10:00.000000', 27),

(8,
 'Startup Trends to Watch',
 'A look at emerging startup areas, developer tools and technology businesses.',
 'jayantha', 4, 'PUBLISHED',
 '2026-09-27 10:45:00.000000', '2026-09-27 10:45:00.000000', 9),

(9,
 'Understanding Event Driven Microservices',
 'How RabbitMQ and Kafka can be used to build asynchronous and scalable microservice systems.',
 'jayanthe', 1, 'REVIEW',
 '2026-09-28 15:30:00.000000', '2026-09-28 15:30:00.000000', 0),

(10,
 'A Beginner Guide to RAG',
 'A practical explanation of document loading, chunking, embeddings, vector stores and retrieval augmented generation.',
 'jayanthn', 6, 'DRAFT',
 '2026-09-29 17:00:00.000000', '2026-09-29 17:00:00.000000', 0),

(11,
 'Improving NewsPortal Performance',
 'Ideas for caching, pagination, database indexing and efficient service communication.',
 'jayantha', 1, 'REVIEW',
 '2026-10-01 11:00:00.000000', '2026-10-01 11:00:00.000000', 0),

(12,
 'Technology and the Modern Workplace',
 'How modern software platforms and automation are changing everyday professional workflows.',
 'jayanthe', 4, 'DRAFT',
 '2026-10-02 14:00:00.000000', '2026-10-02 14:00:00.000000', 0);

-- ==========================================================
-- 5. ARTICLE LIKES
-- ==========================================================
CREATE TABLE article_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_article_like UNIQUE (article_id, username)
);

INSERT INTO article_likes (id, article_id, username, created_at) VALUES
(1, 1, 'jayantha', '2026-09-20 12:00:00.000000'),
(2, 1, 'jayanthn', '2026-09-20 12:05:00.000000'),
(3, 2, 'jayantha', '2026-09-21 13:00:00.000000'),
(4, 2, 'jayanthn', '2026-09-21 13:10:00.000000'),
(5, 3, 'jayantha', '2026-09-22 10:00:00.000000'),
(6, 4, 'jayanthe', '2026-09-23 15:00:00.000000'),
(7, 5, 'jayanthn', '2026-09-24 17:00:00.000000'),
(8, 6, 'jayanthe', '2026-09-25 15:00:00.000000'),
(9, 6, 'jayanthn', '2026-09-25 15:10:00.000000'),
(10, 7, 'jayantha', '2026-09-26 13:00:00.000000'),
(11, 7, 'jayanthn', '2026-09-26 13:15:00.000000'),
(12, 8, 'jayanthe', '2026-09-27 11:30:00.000000');

-- ==========================================================
-- 6. COMMENT SERVICE
-- ==========================================================
DROP DATABASE IF EXISTS news_comment_db;
CREATE DATABASE news_comment_db;
USE news_comment_db;

CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT NOT NULL,
    content VARCHAR(1000) NOT NULL,
    author_username VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL
);

INSERT INTO comments
(id, article_id, content, author_username, created_at)
VALUES
(1, 1, 'This is a useful overview of Spring Boot microservices.', 'jayanthn',
 '2026-09-20 13:00:00.000000'),
(2, 1, 'The API Gateway section was particularly helpful.', 'jayantha',
 '2026-09-20 13:15:00.000000'),
(3, 2, 'Good introduction to the main GenAI concepts.', 'jayanthn',
 '2026-09-21 14:00:00.000000'),
(4, 3, 'Looking forward to the series.', 'jayantha',
 '2026-09-22 11:00:00.000000'),
(5, 6, 'Tool calling is an important part of agent systems.', 'jayanthn',
 '2026-09-25 16:00:00.000000'),
(6, 7, 'The JWT explanation is clear and practical.', 'jayantha',
 '2026-09-26 14:00:00.000000'),
(7, 8, 'Interesting startup trends.', 'jayanthn',
 '2026-09-27 12:00:00.000000');

-- ==========================================================
-- 7. ALERT SERVICE
-- ==========================================================
DROP DATABASE IF EXISTS news_alert_db;
CREATE DATABASE news_alert_db;
USE news_alert_db;

CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_username VARCHAR(255) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME(6)
);

INSERT INTO alerts
(id, target_username, message, is_read, created_at)
VALUES
(1, 'jayantha', 'Welcome to NewsPortal. Your administrator account is ready.', b'0',
 '2026-10-08 10:00:00.000000'),
(2, 'jayanthe', 'Welcome to NewsPortal. Your editor account is ready.', b'0',
 '2026-10-08 10:01:00.000000'),
(3, 'jayanthn', 'Welcome to NewsPortal. Start exploring published articles.', b'0',
 '2026-10-08 10:02:00.000000'),
(4, 'jayanthe', 'Your article "Understanding Event Driven Microservices" is waiting for review.', b'0',
 '2026-10-08 10:05:00.000000'),
(5, 'jayantha', 'A new article has been submitted for review.', b'0',
 '2026-10-08 10:06:00.000000'),
(6, 'jayanthn', 'New technology articles are available on NewsPortal.', b'1',
 '2026-10-08 10:07:00.000000');

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- SEEDED LOGIN ACCOUNTS
-- ==========================================================
-- Username : jayantha
-- Email    : jayanthvvo395@gmail.com
-- Role     : ROLE_ADMIN
-- Password : 123456
--
-- Username : jayanthe
-- Email    : jayanthe@newsportal.com
-- Role     : ROLE_EDITOR
-- Password : 123456
--
-- Username : jayanthn
-- Email    : jayanthn@newsportal.com
-- Role     : ROLE_USER
-- Password : 123456
-- ==========================================================
