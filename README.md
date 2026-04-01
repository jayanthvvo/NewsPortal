# NewsPortal Microservices Architecture

## Overview
**Candidate:** JAYANTH V  
**Project:** NewsPortal  
**Description:** A digital news platform designed for publishing articles, managing categories, assigning editor roles, dispatching breaking news alerts, and facilitating user comments. It is built using a Spring Cloud Microservices architecture to ensure high availability, rapid content delivery, and robust security.

## 🏗️ High-Level Architecture
The system is fully decoupled, utilizing the Spring Cloud ecosystem for dynamic routing, centralized configuration, and service discovery.

### Core Infrastructure
* **Frontend:** Single Page Application (SPA) dashboard for user and editor interaction (Planned).
* **API Gateway:** Spring Cloud Gateway for centralized traffic routing and JWT security enforcement.
* **Service Discovery:** Netflix Eureka for dynamic microservice registration and load balancing.
* **Config Server:** Centralized configuration management for all backend services.

---

## 🧩 Microservices Breakdown

| Service | Database | Description & Responsibilities |
| :--- | :--- | :--- |
| **Auth Service** | `news_auth_db` | **Security Sentinel.** Handles login, registration, and generates JWTs. |
| **User Service** | `news_user_db` | Manages user profiles, editor roles, and author configurations. |
| **Article Service** | `news_article_db` | **Core Engine.** Handles drafting, reviewing, and publishing news articles. |
| **Category Service** | `news_category_db` | Manages news taxonomies, tags, and topic hierarchies. |
| **Comment Service** | `news_comment_db` | Manages user discussions and moderation workflows on published articles. |
| **Alert Service** | `news_alert_db` | Dispatches breaking news push notifications via event-driven messaging. |

---

## ⚙️ Key Design Implementations

### Inter-Service Communication
* **Synchronous:** Strict data consumption between MVC layers is handled via **OpenFeign** clients, routed natively through the Eureka Service Registry.
* **Asynchronous (Event-Driven):** Non-blocking operations, such as dispatching breaking news alerts when an article is published, are handled via message brokers.

### Centralized Dependency Management
A parent `pom.xml` utilizes a `dependencyManagement` block (Spring Boot BOM) to strictly isolate and control dependency versions across all microservices.

### Logging Strategy
* **Implementation:** Lombok's `@Slf4j` annotation is used across all classes.
* **Routing:** Each service utilizes `logback-spring.xml` to route logs to both a `ConsoleAppender` and a `RollingFileAppender` for robust file-based tracking.

---

## 🛡️ Quality Assurance & CI/CD
To guarantee enterprise-grade stability, this project enforces strict quality gates:
* **Testing Layer:** Unit testing for all controllers, services, and repositories using **JUnit 5** and **Mockito**.
* **Code Coverage:** **Jacoco** is integrated into the build lifecycle. Builds will fail if test coverage drops below the mandatory threshold.
* **Static Code Analysis:** **SonarQube** integration ensures exactly zero high-severity vulnerabilities, bugs, or code smells.