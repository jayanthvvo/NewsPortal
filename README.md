# NewsPortal Microservices Architecture

## Overview
NewsPortal is a high-availability, distributed news platform built using a Spring Cloud Microservices architecture. Designed for rapid content delivery and robust security, it features an event-driven backend and a responsive Single Page Application (SPA) dashboard for interactive analytics.

## 🏗️ High-Level Architecture
The system is entirely decoupled, with each microservice exposing Swagger-documented REST APIs and maintaining strict database isolation.

### Core Infrastructure
* **Frontend:** React (or Angular) SPA featuring interactive admin dashboards (Recharts/Chart.js).
* **API Gateway:** Spring Cloud Gateway for centralized traffic routing and JWT enforcement.
* **Service Discovery:** Netflix Eureka for dynamic service registration and client-side load balancing.
* **Message Broker:** RabbitMQ / Apache Kafka for asynchronous, event-driven communication.

---

## 🧩 Microservices Breakdown

| Service | Database | Description & Responsibilities |
| :--- | :--- | :--- |
| **Auth Service** | `auth-db` | **Security Sentinel.** Handles login, registration, and generates JWTs. |
| **User Service** | `user-db` | Manages user profiles, editor roles, and author configurations (CRUD). |
| **Article Service** | `article-db` | **Core Engine.** Handles drafting, reviewing, and publishing news workflows. |
| **Category Service** | `category-db` | Manages news taxonomies, tags, and topic hierarchies. |
| **Comment Service** | `comment-db` | Manages user engagement on articles and moderation workflows. |
| **Alert Service** | `alert-db` | Dispatches breaking news push notifications via asynchronous message queues. |
| **Analytics Service** | `analytics-db` | Aggregates read counts, comment volumes, and trends for interactive charts. |

---

## ⚙️ Key Design Implementations

### Inter-Service Communication
* **Synchronous:** Strict data consumption between MVC layers is handled via **OpenFeign** clients (routed natively through the Eureka Service Registry).
* **Asynchronous (Event-Driven):** When an article is published, the Article Service updates its database and simultaneously fires an `ArticlePublishedEvent` to the message broker. The **Alert Service** and **Analytics Service** consume this event to trigger push notifications and update reporting dashboards without blocking the publishing workflow.

### Centralized Dependency Management
A parent `pom.xml` utilizes a `dependencyManagement` block (Spring Boot BOM) to strictly isolate and control dependency versions across all microservices.

### Logging Strategy
* **Implementation:** Lombok's `@Slf4j` annotation is used across all classes.
* **Routing:** Each service utilizes `logback-spring.xml` to route logs to both a `ConsoleAppender` and a `RollingFileAppender` for robust file-based tracking.

---

## 🛡️ Quality Assurance & CI/CD

To guarantee enterprise-grade stability, this project enforces strict quality gates:
* **Testing Layer:** Unit testing for all controllers, services, and repositories using **JUnit 5** and **Mockito**.
* **Code Coverage:** **Jacoco** is integrated into the build lifecycle. Builds will fail if test coverage drops below the mandatory 80% threshold (targeting 100%).
* **Static Code Analysis:** **SonarQube** integration ensures exactly zero high-severity vulnerabilities, bugs, or code smells.