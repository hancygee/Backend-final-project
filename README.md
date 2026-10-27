# Backend-final-project
# 🏨 ITCS258 – Hotel Booking REST API System

**Faculty of Information and Communication Technology, Mahidol University**

**Course:** ITCS258 Backend Application Development
**Academic Year:** 2026 (Semester 1/2569)
**Project Type:** Group Project (3 Students)
**Assigned Date:** August 7, 2026
**Submission Deadline:** November 20, 2026, 11:55 PM (UTC+7)
**Peer Review Deadline:** November 24, 2026, 11:55 PM (UTC+7)

## 1. Project Overview

The objective of this project is to design, implement, test, and deploy a production-ready RESTful API for a Hotel Booking System.

The backend will support hotel room management, room availability searching, user authentication, booking management, and notifications.

The project emphasizes secure backend engineering, performance, reliability, maintainability, automated testing, containerization, and deployment.

The system must comply with the official [Hotel Booking Specification](https://wudhicharts.notion.site/69-1-ITCS258-Hotel-Booking-Specification-3af44724c3068044ba16c50510557b0a).

## 2. Team Requirements

The project must be developed by a group of three students.

All team members are expected to contribute to:

* Backend development
* Automated testing
* Project documentation

Development and collaboration must comply with academic integrity guidelines.

### Team Members

| Member   | Student ID | Responsibilities |
| -------- | ---------- | ---------------- |
| Member 1 | TBD        | TBD              |
| Member 2 | TBD        | TBD              |
| Member 3 | TBD        | TBD              |

## 3. Required Technology Stack

| Component               | Technology                       |
| ----------------------- | -------------------------------- |
| Programming Language    | TypeScript                       |
| Backend Framework       | NestJS                           |
| Database                | MySQL or another relational DBMS |
| ORM                     | Prisma or TypeORM                |
| Authentication          | JWT                              |
| API Documentation       | Swagger / OpenAPI                |
| Caching & Rate Limiting | Redis or equivalent              |
| Testing                 | Jest + Supertest                 |
| Containerization        | Docker & Docker Compose          |
| Deployment              | School-provided or public server |

## 4. System Roles

The system supports three categories of users.

### Guest

An unauthenticated visitor who can access permitted public endpoints, including room information and search functionality.

### Registered User

An authenticated user who can manage their profile, search for available rooms, create bookings, and manage their own bookings.

### Admin

An authorized administrator who can manage hotel rooms, access all bookings, and perform administrative booking operations.

Detailed permissions must follow the Hotel Booking Specification.

## 5. Functional Scope

The backend must implement all **38 functional requirements (FR-1 through FR-38)** defined in the Hotel Booking Specification.

The main functional areas are:

### 5.1 User Accounts and Authentication (FR-1–FR-7)

* User registration
* Login and logout
* View user profile
* Update user profile
* Support Regular User and Admin roles
* Enforce appropriate authorization

### 5.2 Room Management (FR-8–FR-16)

* Admin room creation
* Room information retrieval
* Room information updates
* Room deletion or management as specified
* Room image metadata
* Room capacity
* Price per night
* Active and deactivated room states
* Public room listing and detail retrieval

### 5.3 Booking Management

* Create bookings for authenticated users
* Manage personal bookings
* Validate booking dates
* Prevent double booking
* Allow administrators to view and manage all bookings

Booking statuses:

| Status    | Meaning                |
| --------- | ---------------------- |
| Pending   | Initial booking status |
| Approved  | Booking approved       |
| Cancelled | Booking cancelled      |
| Paid      | Booking marked as paid |

### 5.4 Room Search and Filtering

The API must support room searching based on:

* Date range
* Capacity or other supported attributes
* Availability during the selected dates

Unavailable rooms must be excluded from relevant availability results.

### 5.5 Notifications

The backend must record booking-related events, including booking creation and cancellation, so that clients can retrieve notifications.

### 5.6 System Operations

* Consistent success responses
* Meaningful error responses
* Appropriate HTTP status codes
* Health-check endpoint
* Docker-compatible execution
* Server deployment readiness

## 6. Project Implementation Tasks

### Task 1: Core REST API Design and Implementation

Implement the required REST endpoints for user accounts, rooms, bookings, search, notifications, and system operations.

All endpoints must follow RESTful conventions, use appropriate HTTP status codes, and return clear error messages.

### Task 2: Authentication and Authorization

Implement secure authentication and authorization.

Requirements include:

* Secure registration and login
* Password hashing
* Safe credential storage
* JWT-based or equivalent protected access
* Protection of sensitive information
* Authenticated booking operations
* Administrative restrictions for room and booking management

### Task 3: Role-Based Access Control (RBAC)

Implement at least two authenticated roles: Regular User and Admin.

Regular Users must be restricted to their own data and bookings. Admins must have the required administrative permissions for rooms and bookings.

Use NestJS guards, middleware, or equivalent backend authorization mechanisms.

### Task 4: Caching, Rate Limiting, and Performance

The API must be designed for reasonable response times and concurrent usage.

Implement at least:

* One caching strategy for frequently accessed resources
* One rate-limiting strategy for sensitive or high-traffic endpoints

Potential caching targets include room lists and room details.

Potential rate-limiting targets include authentication and booking creation.

Document the selected strategies, where they are used, why they are appropriate, and how data freshness and system stability are maintained.

### Task 5: Swagger / OpenAPI Documentation

Provide interactive API documentation covering:

* Authentication and users
* Rooms
* Bookings
* Search
* Notifications
* Health checks
* Request and response schemas
* HTTP status codes
* Authentication requirements

The documentation must be accessible and consistent with the implemented API.

### Task 6: Automated API Testing

Implement all three testing levels.

**Unit Testing**

Test core business logic, including booking date validation, conflict prevention, role checking, and booking status transitions.

**Integration Testing**

Test controllers and endpoints with a test database, including registration, login, administrative room operations, booking operations, and search behavior.

**End-to-End Testing**

Test realistic workflows such as:

User registration → Login → Search rooms → Create booking → Cancel booking.

Tests must include meaningful assertions, run through automated commands, and clean up test data.

An API Testing document and execution instructions are required.

### Task 7: Dockerization

Containerize the backend using Docker.

Requirements include:

* A working production-oriented Dockerfile
* Configuration through environment variables
* No hard-coded secrets
* Docker Compose or equivalent local orchestration where needed
* A reliable way to run the API and its database

A multi-stage Docker build is recommended but not mandatory.

### Task 8: Deployment

Deploy the containerized application to a suitable server environment.

The deployment must provide:

* A working backend service
* Database connectivity
* Usable health checks
* Operational logging
* Public API URL
* Securely provided test account details
* Step-by-step deployment instructions

## 7. Non-Functional Requirements

The implementation must satisfy the non-functional requirements in the Hotel Booking Specification.

Major quality areas include:

| Area            | Expectations                                              |
| --------------- | --------------------------------------------------------- |
| Security        | Secure authentication, authorization, credential handling |
| Performance     | Efficient API operations and database queries             |
| Reliability     | Correct behavior and error handling                       |
| Scalability     | Design suitable for concurrent usage                      |
| Maintainability | Modular, understandable code                              |
| Observability   | Useful logging and health checks                          |
| Testing         | Automated unit, integration, and E2E testing              |
| Deployment      | Containerized and configurable execution                  |

## 8. Documentation Requirements

The repository must include a comprehensive `README.md` covering:

* Project overview and architecture
* Environment configuration
* Development setup
* Running the API locally
* Running with and without Docker
* API usage examples
* API testing documentation
* Test execution commands and results
* Docker build and execution instructions
* Deployment environment and procedures
* Architecture diagram, if available

The project must also provide Swagger/OpenAPI documentation.

## 9. Submission Requirements

Submission is handled through **Classroom50**.

The student with the smallest student ID must create the Classroom50 team when first accessing the project.

The required team naming format is:

`691_ITCS258_GroupY`

Replace `Y` with the assigned team number.

Other members must join the correct Classroom50 team.

### Required Submission Materials

* REST API source code
* Modular and clearly organized implementation
* Configuration templates such as `.env.example`
* Unit, integration, and E2E tests
* Swagger/OpenAPI specification and access instructions
* Dockerfile and relevant Docker Compose files
* Deployment instructions or scripts
* Complete README documentation

Do not submit `node_modules`, unnecessary generated dependencies, or actual credentials and secrets.

## 10. Grading Criteria

| Category                                |  Points |
| --------------------------------------- | ------: |
| Core REST API & Functional Requirements |      30 |
| Security, Authentication & RBAC         |      15 |
| Performance, Caching & Rate Limiting    |      10 |
| Swagger Documentation                   |      10 |
| API Testing                             |      15 |
| Dockerization & Deployment              |      10 |
| Code Quality, Observability & README    |      10 |
| **Total**                               | **100** |

### Important Grading Conditions

* All functional requirements FR-1 through FR-38 must be implemented.
* Missing or partially implemented requirements can affect multiple grading categories.
* APIs must function correctly, not merely compile.
* Security problems, such as exposing passwords, can result in serious deductions.
* Correct design and genuine implementation are essential.

## 11. Peer Code Review

Project grading includes peer review.

Each development group will be assigned another group to evaluate its implementation.

The reviewing group must examine the submitted code and prepare a grading report.

Review assignments are anonymous, and submissions are provided as ZIP files.

Reviewers may earn bonus points of up to 3% for identifying genuine issues. Inaccurate evaluations may lead to deductions after instructor verification.

**Peer Review Deadline: November 24, 2026, 11:55 PM (UTC+7).**

Failure to submit the required peer review by this deadline results in a zero project score for the reviewing group.

## 12. Development Progress

Use this checklist to track the implementation.

* [ ] Initialize NestJS project
* [ ] Configure relational database and ORM
* [ ] Implement user registration and login
* [ ] Implement JWT authentication
* [ ] Implement role-based access control
* [ ] Implement user profile endpoints
* [ ] Implement room management
* [ ] Implement room searching and filtering
* [ ] Implement booking creation and management
* [ ] Implement double-booking prevention
* [ ] Implement booking status management
* [ ] Implement notifications
* [ ] Implement health-check endpoint
* [ ] Implement caching
* [ ] Implement rate limiting
* [ ] Configure Swagger/OpenAPI
* [ ] Write unit tests
* [ ] Write integration tests
* [ ] Write E2E tests
* [ ] Create Dockerfile
* [ ] Configure Docker Compose
* [ ] Deploy API to server
* [ ] Verify all FR-1 through FR-38
* [ ] Complete README and testing documentation
* [ ] Submit project through Classroom50
* [ ] Complete assigned peer code review

## 13. References

**Official Project Description:**
https://wudhicharts.notion.site/69-1-ITCS258-Project-Description-3af44724c30680a89d55c5b71b052964

**Official Hotel Booking Specification:**
https://wudhicharts.notion.site/69-1-ITCS258-Hotel-Booking-Specification-3af44724c3068044ba16c50510557b0a

---

**Academic Notice:** This README is a project-oriented adaptation of the ITCS258 assignment description. The official course documents remain authoritative. All implementation and collaboration must comply with the course's academic integrity rules.

**© Faculty of ICT, Mahidol University. All rights reserved.**

