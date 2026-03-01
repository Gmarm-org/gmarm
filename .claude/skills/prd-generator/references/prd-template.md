# PRD Template Reference

Use this exact structure when generating PRDs. Adapt content to the specific project but preserve ordering and formatting.

---

## Full PRD Structure

```markdown
# [Project Name]

## Overview

[2-3 sentence description of the initiative and its business value. Explain what problem this solves and who benefits.]

| Field        | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Product Lead | @[Name]                                                      |
| Tech Lead    | @[Name]                                                      |
| Design Lead  | @[Name] or N/A                                               |
| Epic         | Link epic once it is created                                 |
| Approved By  | Reviewer will add their name here after they approve the PRD |

## Goal

- **[Goal category]**: [Description of objective]
- **[Goal category]**: [Description of objective]
- **[Goal category]**: [Description of objective]

## Problem

[Detailed description of the current state and why change is needed. Be specific about pain points.]

- **Who is affected**: [Stakeholders, users, teams impacted]
- **Why it's critical**: [Business justification and urgency]

## Risks

- **[Risk Name]**: [Description of risk and potential impact on timeline, quality, or scope]
- **[Risk Name]**: [Description of risk and potential impact]

## Dependencies

**Technologies**: [Required frameworks, libraries, or platforms]

**Teams**: [Other teams this project depends on]

**Third-Party**: [External services or APIs]

## Requirements

### Functional Requirements for [Feature Area]

- [Requirement statement - clear and testable]
  - [Sub-requirement or detail]
    - [Further detail if needed]
- [Next requirement]

### Functional Requirements for [Another Feature Area]

- [Requirement statement]
  - [Sub-requirement]

### Non-Functional Requirements

- [Performance, security, scalability, or quality requirement]
- [Accessibility or compliance requirement]

## Product Diagrams

[Description of diagrams or link to visual representations]

## Assumptions

- [Assumption about users, environment, or technical constraints]
- [Assumption about data or integrations]
- [Assumption about timeline or resources]

## Out of Scope

[Define what is explicitly not included in the project to ensure boundaries are clear.]

- [Excluded feature or capability]
- [Excluded feature or capability]

## UX Designs

[Link to Figma or design files]

## Architecture/Diagrams

[Outline the technical architecture. Include diagrams showing component interactions, data flow, and key technical decisions.]

The feature follows a clean architecture pattern with clear separation between the API layer, service layer, and data access layer.
```

[Frontend] --> [Backend API] --> [PostgreSQL]
                   |
                   v
          [Service Layer]
                   |
        ├── Controller (REST endpoints)
        ├── Service (Business logic)
        └── Repository (Data access via JPA)

```

## Infrastructure and Monitoring

[Assess impact on existing infrastructure. List what needs to be done to prevent negative scenarios — resource allocation, Docker container sizing, database connection pooling.]

**Infrastructure Impact:**

- No additional infrastructure required; feature uses existing Docker Compose deployment
- Database: 2 new tables (example_entity, example_config)
- Expected load: low volume, existing capacity sufficient

**Monitoring Strategy:**

- Docker container health checks
- Backend logs via `docker logs gmarm-backend-local`
- PostgreSQL query monitoring via `pg_stat_statements`
- Alert on application startup failures

## Technical Approach

### [Component/Domain Name]

#### 1. [BACKEND][DOMAIN] [Task Title]

1. **Depends On**: [BACKEND][DOMAIN] [Previous Task Title]
2. **Description**: [What this task accomplishes and why]
3. **Visual Reference**: [Description of UI/UX or "N/A"]
4. **Implementation**:
   a. [Implementation step or component]
      i. [Detail or sub-step]
      ii. [Detail or sub-step]
   b. [Next implementation step]
      i. [Detail]
   c. [Code structure if needed]:
   ```java
   // Example structure - not full implementation
   @Data @Builder @NoArgsConstructor @AllArgsConstructor
   public class ExampleCreateDTO {
       @NotBlank
       private String field;
   }
   ```

5. **Acceptance Criteria**:
   a. [Specific, testable criterion]
   b. [Specific, testable criterion]
   c. Unit/integration tests passing

#### 2. [FRONTEND][DOMAIN] [Next Task Title]

1. **Depends On**: [BACKEND][DOMAIN] [Previous Task Title]
2. **Description**: [What this task accomplishes]
3. **Implementation**:
   a. [Implementation detail]
   b. [Data model or API contract]:

| Field      | Type                 | Description                       |
| ---------- | -------------------- | --------------------------------- |
| id         | Long                 | Unique identifier                 |
| field_name | String (required)    | Description of field              |
| status     | Enum (String)        | Possible values: VALUE_A, VALUE_B |
| created_at | LocalDateTime        | Timestamp of creation             |

4. **Acceptance Criteria**:
   a. [Criterion]
   b. [Criterion]

[Continue for all tasks...]

## Open Questions/Concerns

[List any unresolved questions or concerns that need to be addressed before the project can proceed.]

1. **[Topic]**: [Question that needs resolution]
2. **[Topic]**: [Question that needs resolution]
```

---

## Data Model Table Format

Use tables for all entity and DTO definitions:

**[EntityName]**

| Field              | Type                            | Description                                |
| ------------------ | ------------------------------- | ------------------------------------------ |
| id                 | Long                            | Unique identifier (auto-generated)         |
| external_reference | String                          | External reference for 3rd party APIs      |
| name               | String (required)               | Display name                               |
| status             | Enum (String)                   | Possible values: ACTIVO, INACTIVO, PENDIENTE |
| type               | Enum (String, optional)         | Possible values: TYPE_A, TYPE_B, OTHER     |
| amount             | BigDecimal (optional)           | Currency amount                            |
| date_field         | LocalDate                       | Date value                                 |
| is_enabled         | Boolean (optional)              | Feature flag                               |
| related_id         | Long                            | Foreign key to [RelatedEntity]             |

---

## API Path Table Format

| Path                                              | Description                                                  |
| ------------------------------------------------- | ------------------------------------------------------------ |
| GET /api/resources?page=0&size=20                  | List and search. Results paged by default, size max 100.     |
| POST /api/resources                                | Create a new entity                                          |
| GET /api/resources/{id}                            | Retrieve entity by ID                                        |
| PATCH /api/resources/{id}                          | Partial update entity                                        |
| PUT /api/resources/{id}                            | Full update entity                                           |
| DELETE /api/resources/{id}                         | Delete entity (soft delete if applicable)                    |

---

## Code Structure Examples

### Java DTO Example

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateResourceDTO {

    @NotBlank(message = "Field name is required")
    private String fieldName;

    private String optionalField;
}
```

### JPA Entity Example

```java
@Entity
@Table(name = "resource_name")
@Getter @Setter
@EqualsAndHashCode(of = "id")
@NoArgsConstructor @AllArgsConstructor @Builder
public class ResourceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EstadoResource status;
}
```
