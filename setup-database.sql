-- ==========================================================
-- 1. AUTH SERVICE (news_auth_db)
-- ==========================================================
CREATE DATABASE IF NOT EXISTS news_auth_db;
USE news_auth_db;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    password VARCHAR(255),
    role ENUM('ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_USER'),
    username VARCHAR(255),
    status ENUM('APPROVED', 'PENDING', 'REJECTED'),
    otp VARCHAR(255),
    otp_expiry DATETIME(6)
);

INSERT IGNORE INTO users (id, email, password, role, username, status, otp, otp_expiry) VALUES
(1, 'jayanth@test.com', '$2a$10$H4FCr9GwyY0xZpZpzPaSyuuWd/B6Afz26M7ShlQoeYQHmiLMtJmni', 'ROLE_USER', 'jayanth', NULL, NULL, NULL),
(2, 'admin@newsportal.com', '$2a$10$/D7VRmsv2DuaZ6kOPyPuauj1OLg/5UZyECJ/jd3s06vZtNyayVJoC', 'ROLE_USER', 'adminUser', NULL, NULL, NULL),
(3, 'jayanthvvo395@gmail.com', '$2a$10$hQGb1i2Xa3LQ6/b2KGuGheoBTWGHMjkYtqKBkhay8nVcNGp/xcS2S', 'ROLE_ADMIN', 'jayanthvvo', 'APPROVED', '478211', '2026-05-01 06:10:43.803984'),
(4, 'password123', '$2a$10$xMQ0hrUccmtQHm8oHfKQrOj/80rJKCiQCGHH3ANyK.nuZ/HDmlhHu', 'ROLE_USER', 'jay1', NULL, NULL, NULL),
(5, NULL, '$2a$10$lNapdW0zz9tm5KU35YgjC.ovITMaIkwO2FMGCxQ9WN3n4gHWVAmJq', 'ROLE_USER', 'jay2', NULL, NULL, NULL),
(6, '123455', '$2a$10$SX.qTFuHNXZ9aRk/gsPtTu8NYxwTb8N7PST5xwALTETg4DImjpTbW', 'ROLE_USER', 'jay3', NULL, NULL, NULL),
(7, 'jayanthvvo395@gmail.co', '$2a$10$ZB8chhygkBHAaBeEt7kusuMRnkkhJ02gaBacqPHHxGnYUOm2QZpSy', 'ROLE_USER', 'jayvvo', NULL, NULL, NULL),
(8, 'jayanthvvo395@gmail.c', '$2a$10$FZljP2AwbCKkJ.CoHMFcy.MU82PSp/ZJ5ckTwxEHu6ITE2q.bVm6q', 'ROLE_USER', 'jayvvo1', 'REJECTED', NULL, NULL),
(9, 'jayanthvvo395@gmail.c1111', '$2a$10$ZhklOxMVu/IVJz1aCFuZq.nV92GgXgoDeBN4crFynayoEYStdxF3q', 'ROLE_USER', 'jayvvo11', 'APPROVED', NULL, NULL),
(10, 'jane@newsportal.com', '$2a$10$mUvKulpXk1WzXIf0Qw56bOr98AcfO4rPDlGY5RDUQ5Bqamb5WuDLq', 'ROLE_EDITOR', 'jayanth_editor', 'APPROVED', NULL, NULL),
(11, 'jane@newsportal.com1', '$2a$10$c7iS9YvtA7xNeHkfgn/Wd.k/mYMTs1W8e0QxA5mzUuYQ9NBI1HJc6', 'ROLE_EDITOR', 'jayanth_editor1', 'APPROVED', NULL, NULL),
(12, 'jane@newsportal.com2', '$2a$10$Ytki4bkiJ6rV6MLr3Uw/Q.4Ac7LiDyg0t22oGYIAw5HCBu1jjnOHi', 'ROLE_USER', 'jayanth_user', 'APPROVED', NULL, NULL),
(16, 'brutalspidy06@gmail.com', '$2a$10$G9FLHlIBwhJbROrvKfBck.2mcWyTj19cIPr/1ti6/n6/hMb0FPOqm', 'ROLE_USER', 'brutal', 'APPROVED', NULL, NULL),
(20, 'venkateshav870@gmail.com', '$2a$10$b/mjnb8ahy2sYt/auFmyY.WpwbQ09SpYEnUDCJd08ac0QJh5Vso2u', 'ROLE_EDITOR', 'jayanth-edi', 'APPROVED', NULL, NULL),
(21, 'venkateshav870@gmail.com1', '$2a$10$ryzesUp6XIgQlZvnSOk6qOgvUaLHQBn7q8RyLhpqvWZR1YtnVdmpy', 'ROLE_EDITOR', 'jayanth-edi1', 'APPROVED', NULL, NULL),
(22, 'kuldeep870@gmail.com1', '$2a$10$q8nFlItErAqbKGjUqJnsnuVaVNCk2.ss7QcytvckJEFIDZN51TjWC', 'ROLE_ADMIN', 'kuldeep', 'APPROVED', NULL, NULL),
(23, 'venka@gmail.com', '$2a$10$DAa6lcfyIkqpsbKuJBnn.uNU0vm.etv8BOtTjh1aQyvaT6j0vxiiu', 'ROLE_ADMIN', 'jayanthvvoo', 'APPROVED', NULL, NULL),
(24, 'jayv@gmail.com', '$2a$10$yiZsxAQ82D8KKraB2Dk0Q.Jr.nnRw721DxdiONsMSYUDJsAaTcXNu', 'ROLE_USER', 'jayanthv', 'APPROVED', NULL, NULL),
(25, 'viratkohli@gmail.com', '$2a$10$xSj6Spe0t7XsgdLHfNfKNu.vr3iPBb50ppaWk7wUo6LBRA08m387W', 'ROLE_USER', 'viratkohli', 'APPROVED', NULL, NULL),
(26, 'deepak@gmail.com', '$2a$10$xpozZ1deZHy8JC.OHXoHbOyCV/z5YVPfNpUN7tJXIgwnbcVj3EHn2', 'ROLE_ADMIN', 'deepak', 'APPROVED', NULL, NULL),
(27, 'deefaj@gmail.com', '$2a$10$czWohBivOIxZL7dlrQVEKuZtpm8/wP4FS/U1M9xPSwtb62emRFoYG', 'ROLE_EDITOR', 'deefak', 'APPROVED', NULL, NULL),
(28, 'sachin@gmail.com', '$2a$10$3Aa7nRzgZhZGg/WyHufbK.jLcG87tQlMglWfg.Z38MG2ngldf9Dre', 'ROLE_ADMIN', 'sachin', 'APPROVED', NULL, NULL),
(29, 'vaibhav@gmail.com', '$2a$10$X5XU40Y51NZteb5QoqmGHu8TJD35ViwOuYcdVGeAdEOPmIPYz10WW', 'ROLE_ADMIN', 'vaibhav', 'APPROVED', NULL, NULL),
(30, 'soorya@gmail.com', '$2a$10$G25LM7btaitt8YswQcGlle1f1AXEDeWm/bHGHyjfE8ejrxoeEXTJO', 'ROLE_ADMIN', 'soorya', 'APPROVED', NULL, NULL),
(31, 'alok@gmail.com', '$2a$10$symRSrCCi/4O8Hp8aRt6ne52bfNj7ey9Nin0gOaq5cgsyK1RPXHLa', 'ROLE_EDITOR', 'alok', 'APPROVED', NULL, NULL),
(32, 'ds12092003@gmail.com', '$2a$10$YlRUI2PlxPE58PvpqRS1QeFxu275yX.tkj/GCJgTVf/CjrcotbXTi', 'ROLE_ADMIN', 'darshan', 'APPROVED', NULL, NULL);

-- ==========================================================
-- 2. CATEGORY SERVICE (news_category_db)
-- ==========================================================
CREATE DATABASE IF NOT EXISTS news_category_db;
USE news_category_db;

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255),
    name VARCHAR(50)
);

INSERT IGNORE INTO categories (id, description, name) VALUES
(1, 'Latest updates in the tech world', 'Technology'),
(2, 'sports', 'Sport'),
(3, 'education', 'education'),
(6, 'entertainment', 'entertainment'),
(7, 'AI', 'AI'),
(8, 'fashion', 'fashion'),
(9, 'politics', 'politics'),
(10, 'food', 'food');


-- ==========================================================
-- 3. COMMENT SERVICE (news_comment_db)
-- ==========================================================
CREATE DATABASE IF NOT EXISTS news_comment_db;
USE news_comment_db;

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT,
    author_username VARCHAR(255),
    content VARCHAR(1000),
    created_at DATETIME(6)
);

INSERT IGNORE INTO comments (id, article_id, author_username, content, created_at) VALUES
(3, 8, 'jayanthvvo', 'This is a very insightful article. Thanks for sharing!', NOW(6)),
(5, 8, 'jayanthv', 'wrhtwtrhwwrhrtrh', NOW(6)),
(6, 8, 'jayanthv', 'rwrthyhyh', NOW(6)),
(9, 17, 'jayanth-edi', 'ok', NOW(6)),
(12, 19, 'jayanthv', 'big fan', NOW(6)),
(13, 21, 'jayanthvvo', 'ok', NOW(6)),
(15, 19, 'darshan', 'congrats', NOW(6));


-- ==========================================================
-- 4. USER SERVICE (news_user_db)
-- ==========================================================
CREATE DATABASE IF NOT EXISTS news_user_db;
USE news_user_db;

CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    avatar_url VARCHAR(255),
    bio VARCHAR(500),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    username VARCHAR(255),
    email VARCHAR(255)
);

INSERT IGNORE INTO user_profiles (id, avatar_url, bio, first_name, last_name, username, email) VALUES
(1, NULL, 'I am a news editor and tech enthusiast.', 'Jayanth', 'V', 'jayanthvvo', NULL),
(3, NULL, NULL, NULL, NULL, 'brutal', 'brutalspidy06@gmail.com'),
(4, NULL, 'I am a news editor and tech enthusiast..', 'Jayanth', 'V', 'jayanth-edi', 'venkateshav870@gmail.com'),
(5, NULL, NULL, NULL, NULL, 'jayanth-edi1', 'venkateshav870@gmail.com1'),
(6, NULL, NULL, NULL, NULL, 'kuldeep', 'kuldeep870@gmail.com1'),
(7, NULL, NULL, NULL, NULL, 'jayanthvvoo', 'venka@gmail.com'),
(8, NULL, 'user', 'jayanth', 'v', 'jayanthv', 'jayv@gmail.com'),
(9, NULL, NULL, NULL, NULL, 'viratkohli', 'viratkohli@gmail.com'),
(10, NULL, NULL, NULL, NULL, 'jayvvo11', 'jayanthvvo395@gmail.c1111'),
(11, NULL, NULL, NULL, NULL, 'jayanth_editor1', 'jane@newsportal.com1'),
(12, NULL, 'Hello! I am a new user on the News Portal.', NULL, NULL, 'deepak', 'deepak@gmail.com'),
(13, NULL, 'Hello! I am a new user on the News Portal.', NULL, NULL, 'vaibhav', 'vaibhav@gmail.com'),
(14, NULL, 'Hello! I am a new user on the News Portal.', NULL, NULL, 'soorya', 'soorya@gmail.com'),
(15, NULL, 'Hello! I am a new user on the News Portal.', NULL, NULL, 'alok', 'alok@gmail.com'),
(16, NULL, 'Hello! I am a new user on the News Portal.', NULL, NULL, 'darshan', 'ds12092003@gmail.com');


-- ==========================================================
-- 5. ARTICLE SERVICE (news_article_db)
-- ==========================================================
CREATE DATABASE IF NOT EXISTS news_article_db;
USE news_article_db;

CREATE TABLE IF NOT EXISTS articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    author_username VARCHAR(255),
    content TEXT,
    created_at DATETIME(6),
    title VARCHAR(200),
    status ENUM('DRAFT', 'PUBLISHED', 'REVIEW'),
    category_id BIGINT
);

INSERT IGNORE INTO articles (id, author_username, content, created_at, title, status, category_id) VALUES
(1, 'jayanth', 'Today, we successfully built a microservice architecture...', NULL, 'Spring Boot is Awesome!', 'DRAFT', 0),
(2, NULL, 'Look at me, I am automatically extracting usernames from JWT tokens like a pro.', NULL, 'My First Secure Article!', 'DRAFT', 0),
(3, 'jayanthvvo', 'Look at me, I am automatically extracting usernames from JWT tokens like a pro.', NULL, 'My First Secure Article!', 'DRAFT', 0),
(4, 'jayanthvvo', 'Look at me, I am automatically extracting usernames from JWT tokens like a pro.', '2026-04-04 13:18:34.639711', 'My First Secure Artic!', 'DRAFT', 0),
(5, 'jayanth_editor', 'Microservices make scaling incredibly efficient...', NULL, 'Breaking News: Spring Boot is Awesome', 'PUBLISHED', 0),
(6, 'jayanth_editor', 'A deep dive into Eureka, API Gateways, and Feign...', '2026-04-07 18:20:50.550056', 'Spring Boot Microservices are taking over', 'PUBLISHED', 1),
(7, 'jayanth_editor', 'A deep dive into Eureka, API Gateways, and Feryjryjign...', '2026-04-07 18:24:20.194969', 'Spring Boot Microservices are taking ovgjdjer', 'PUBLISHED', 1),
(8, 'jayanth-edi', 'A deep dive into Eureka, API Gateways, and Feryjryjign...', '2026-04-11 12:19:43.882566', 'Spring Boot Microservices are taking ovgjdjer', 'PUBLISHED', 1),
(9, 'jayanthvvo', 'A deep dive into Eureka, API Gateways, and Feryjryjign...', '2026-04-13 10:22:26.663636', 'Spring Boot Microservices are taking ovgjdjer', 'DRAFT', 1),
(10, 'jayanthvvo', 'A deep dive into Eureka, API Gateways, and Feryjryjign...', '2026-04-13 10:22:54.660518', 'Spring Boot Microservices are taking ovgjdjer', 'DRAFT', 2),
(11, 'kuldeep', 'A deep dive into Eureka, API Gateways, and Feryjryjign...', '2026-04-13 14:47:19.306744', 'Spring Boot Microservices are taking ovgjdjer', 'PUBLISHED', 1),
(12, 'kuldeep', 'A deep dive into Eureka, API Gateways, and Feryjryjign...', '2026-04-27 12:43:51.110762', 'Spring Boot Microservices are taking ovgjdjer', 'DRAFT', 1),
(13, 'jayanth-edi', 'jnasfgfag', '2026-05-01 12:02:30.109421', 'dgjtk', 'PUBLISHED', 1),
(14, 'jayanth-edi', 'aviueuiuiewhu ', '2026-05-01 12:05:46.891735', 'virat 100', 'PUBLISHED', 2),
(15, 'jayanth-edi', 'okvro', '2026-05-01 12:10:23.932485', 'okboss', 'PUBLISHED', 1),
(16, 'jayanthvvo', 'A  and Feryjryjign...', '2026-05-01 12:13:26.971997', 'virat', 'DRAFT', 2),
(17, 'jayanth-edi', 'egwrhyejtjej', '2026-05-01 12:36:25.244729', 'okghgnd', 'PUBLISHED', 2),
(18, 'jayanth-edi', 'wvah', '2026-05-01 19:19:53.436502', 'okbro', 'PUBLISHED', 1),
(19, 'jayanth-edi', 'vaibhav scored another 100', '2026-05-03 11:54:18.303576', 'vibhav 100', 'PUBLISHED', 2),
(21, 'jayanth-edi', 'iran war', '2026-05-06 12:35:20.116145', 'iran war', 'PUBLISHED', 9),
(22, 'jayanth-edi', 'war', '2026-05-22 14:48:49.648680', 'iran war', 'PUBLISHED', 9);


-- ==========================================================
-- 6. ALERT SERVICE (news_alert_db)
-- ==========================================================
CREATE DATABASE IF NOT EXISTS news_alert_db;
USE news_alert_db;

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME(6),
    is_read BIT(1),
    message VARCHAR(255),
    target_username VARCHAR(255)
);

INSERT IGNORE INTO alerts (id, created_at, is_read, message, target_username) VALUES
(1, '2026-04-05 13:28:37.121962', b'0', 'Welcome to the News Portal! Your profile has been created successfully.', 'jayanthvvo'),
(2, '2026-04-09 13:08:31.662061', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(3, '2026-04-09 13:20:18.612256', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(4, '2026-04-09 13:20:23.444428', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(5, '2026-04-09 13:20:27.620065', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(6, '2026-04-09 13:25:59.069905', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(7, '2026-04-09 13:26:23.599750', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(8, '2026-04-09 13:35:41.735220', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(9, '2026-04-09 13:40:30.676551', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(10, '2026-04-09 13:40:58.676841', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(11, '2026-04-09 13:41:23.810948', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(12, '2026-04-09 13:42:05.892183', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(13, '2026-04-09 13:43:39.618178', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(14, '2026-04-09 13:48:31.467809', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(15, '2026-04-09 13:49:04.454925', b'0', 'URGENT: Major breaking news update. Please check the portal for more details.', 'all_users'),
(16, '2026-04-10 16:54:17.209351', b'0', 'egu unte', 'jayanthvvo'),
(17, '2026-04-10 16:55:29.360951', b'0', 'egu unte', 'jayanthvvo'),
(18, '2026-04-10 16:55:48.803913', b'0', 'egu unte', 'jayanthvvo'),
(19, '2026-04-10 17:46:42.203092', b'0', 'egu unte', 'jayanthvvo'),
(20, '2026-04-10 17:46:47.285657', b'0', 'egu unte', 'brutal'),
(21, '2026-04-11 12:08:21.021912', b'0', 'egu unte', 'jayanthvvo'),
(22, '2026-04-11 12:08:25.948570', b'0', 'egu unte', 'brutal'),
(23, '2026-04-11 12:08:29.920931', b'0', 'egu unte', 'jayanth-edi'),
(24, '2026-04-11 12:08:33.968360', b'0', 'egu unte', 'jayanth-edi1'),
(25, '2026-04-29 21:24:50.387354', b'0', 'ok', 'jayanthvvo'),
(26, '2026-04-29 21:24:54.819704', b'0', 'ok', 'brutal'),
(27, '2026-04-29 21:24:59.128013', b'0', 'ok', 'jayanth-edi'),
(28, '2026-04-29 21:25:03.072357', b'0', 'ok', 'jayanth-edi1'),
(29, '2026-04-29 21:25:07.261321', b'0', 'ok', 'kuldeep'),
(30, '2026-04-29 21:25:11.326488', b'0', 'ok', 'jayanthvvoo'),
(31, '2026-04-29 21:25:15.608382', b'0', 'ok', 'jayanthv'),
(32, '2026-05-03 11:58:14.836613', b'0', 'toxic postponed', 'jayanthvvo'),
(33, '2026-05-03 11:58:19.229326', b'0', 'toxic postponed', 'brutal'),
(34, '2026-05-03 11:58:24.553053', b'0', 'toxic postponed', 'jayanth-edi'),
(35, '2026-05-03 11:58:29.911136', b'0', 'toxic postponed', 'jayanth-edi1'),
(36, '2026-05-03 11:58:33.873237', b'0', 'toxic postponed', 'kuldeep'),
(37, '2026-05-03 11:58:37.969479', b'0', 'toxic postponed', 'jayanthvvoo'),
(38, '2026-05-03 11:58:41.957376', b'0', 'toxic postponed', 'jayanthv'),
(39, '2026-05-03 11:58:45.838464', b'0', 'toxic postponed', 'viratkohli'),
(40, '2026-05-03 11:58:49.637275', b'0', 'toxic postponed', 'jayvvo11'),
(41, '2026-05-22 14:46:51.869964', b'0', 'rcb vs srh', 'jayanthvvo'),
(42, '2026-05-22 14:46:56.560592', b'0', 'rcb vs srh', 'brutal'),
(43, '2026-05-22 14:47:00.546920', b'0', 'rcb vs srh', 'jayanth-edi'),
(44, '2026-05-22 14:47:04.456631', b'0', 'rcb vs srh', 'jayanth-edi1'),
(45, '2026-05-22 14:47:08.435706', b'0', 'rcb vs srh', 'kuldeep'),
(46, '2026-05-22 14:47:12.510670', b'0', 'rcb vs srh', 'jayanthvvoo'),
(47, '2026-05-22 14:47:16.405863', b'0', 'rcb vs srh', 'jayanthv'),
(48, '2026-05-22 14:47:20.310007', b'0', 'rcb vs srh', 'viratkohli'),
(49, '2026-05-22 14:47:24.185644', b'0', 'rcb vs srh', 'jayvvo11'),
(50, '2026-05-22 14:47:28.055930', b'0', 'rcb vs srh', 'jayanth_editor1'),
(51, '2026-05-22 14:47:31.995760', b'0', 'rcb vs srh', 'deepak'),
(52, '2026-05-22 14:47:35.891000', b'0', 'rcb vs srh', 'vaibhav'),
(53, '2026-05-22 14:47:39.865595', b'0', 'rcb vs srh', 'soorya'),
(54, '2026-05-22 14:47:43.863476', b'0', 'rcb vs srh', 'alok'),
(55, '2026-05-22 14:47:47.775711', b'0', 'rcb vs srh', 'darshan');