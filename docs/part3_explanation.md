# Part 3 Explanation Document
## Event Management System — Event + Event Schedule Module
**Written by: Member 3 (Ragini)**

---

## 1. ER Entities and Relationships Covered

Part 3 implements the central core of the college Event Management System. It manages the main `event` entity and its identifying weak entity `event_schedule`.

| Entity / Relationship in ER Diagram | Table(s) Used | Role in ER Diagram |
|---|---|---|
| **Event** (Central Strong Entity) | `event` | The heart of the ER diagram. Connects Venue, Organizer, Club, and Category through foreign keys. |
| **Event Status** (Derived Attribute) | Calculated dynamically via SQL `CASE` | Derived attribute based on `event_date` and `CURDATE()`. **Never physically stored in the database** to maintain 3NF and prevent stale data. |
| **Club Sponsors Event** | `event.club_id` -> `club.club_id` | `1:N` relationship: one club sponsors many events. |
| **Organizer Organizes Event** | `event.organizer_id` -> `organizer.organizer_id` | `1:N` relationship: one organizer coordinates many events. |
| **Venue Hosts Event** | `event.venue_id` -> `venue.venue_id` | `1:N` relationship: one venue hosts many events. |
| **Event Belongs to Category** | `event.category_id` -> `event_category.category_id` | `N:1` relationship: many events belong to one category (Technical, Cultural, Sports). |
| **Event_Schedule** (Weak Entity) | `event_schedule` | **Identifying relationship** with Event. Cannot exist without a parent event. Has a **partial key** (`schedule_id`) and a **composite primary key** `(event_id, schedule_id)`. |
| **Cascade Deletion** | `ON DELETE CASCADE` on `event_schedule.event_id` | When an event is deleted, all of its schedule activities are automatically wiped from the database by MySQL. |

---

## 2. SQL Queries in Part 3

Every query in Part 3 strictly adheres to the course project rules: parameterized placeholders (`?`), multi-line formatted clauses, full table qualifications, and beginner-level clarity.

| Query | What it does in one sentence | SQL Concept Demonstrated |
|---|---|---|
| `SELECT event.event_id, event.event_name, event.description, event.event_date, event.event_type, event.start_time, event.end_time, event.club_id, event.organizer_id, event.venue_id, event.category_id, venue.venue_name, organizer.name AS organizer_name, club.club_name, event_category.category_name, CASE WHEN event.event_date < CURDATE() THEN 'Completed' WHEN event.event_date = CURDATE() THEN 'Ongoing' ELSE 'Upcoming' END AS status FROM event INNER JOIN venue ON event.venue_id = venue.venue_id INNER JOIN organizer ON event.organizer_id = organizer.organizer_id INNER JOIN club ON event.club_id = club.club_id INNER JOIN event_category ON event.category_id = event_category.category_id ORDER BY event.event_date` | Retrieves all events with human-readable venue, organizer, club, and category names, and computes the derived event status based on today's date. | Multi-table `INNER JOIN` (5 tables), `CASE` expression for derived attribute, `CURDATE()`, `ORDER BY` |
| `INSERT INTO event (event_name, description, event_date, event_type, start_time, end_time, club_id, organizer_id, venue_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` | Inserts a new event linked to its respective foreign keys. | Parameterized `INSERT`, Foreign Keys |
| `UPDATE event SET event_name = ?, description = ?, event_date = ?, event_type = ?, start_time = ?, end_time = ?, club_id = ?, organizer_id = ?, venue_id = ?, category_id = ? WHERE event_id = ?` | Updates event information, schedule times, and master relationships. | Parameterized `UPDATE`, `WHERE` |
| `DELETE FROM event WHERE event_id = ?` | Deletes an event by its ID (blocked if registrations exist; cascades to schedule entries). | Parameterized `DELETE`, `WHERE`, Referential Integrity |
| `SELECT event_id, schedule_id, activity_name, start_time, end_time FROM event_schedule WHERE event_id = ? ORDER BY schedule_id` | Retrieves all timeline activities for a given event sorted by activity order. | Parameterized `SELECT`, `WHERE`, `ORDER BY` |
| `SELECT MAX(schedule_id) AS lastId FROM event_schedule WHERE event_id = ?` | Finds the highest existing partial key number within an event to compute the next schedule ID. | Aggregate function `MAX()`, Partial Key computation |
| `INSERT INTO event_schedule (event_id, schedule_id, activity_name, start_time, end_time) VALUES (?, ?, ?, ?, ?)` | Inserts an activity entry under an event using the composite key. | `INSERT` into Weak Entity with Composite Key |
| `DELETE FROM event_schedule WHERE event_id = ? AND schedule_id = ?` | Deletes a single scheduled activity using both keys of the composite primary key. | Parameterized `DELETE`, compound `WHERE` with `AND` |

---

## 3. Step-by-Step Flow

### A. INSERT Flow (Adding a Schedule Activity to an Event)
This demonstrates inserting a record into a **Weak Entity** with a **Partial Key**:

1. **User Action:** On `schedule.html`, the user selects an event (e.g. "Hackathon 2026", `event_id = 1`) from the dropdown, enters Activity Name ("Coding Round 1"), Start Time ("10:00"), and End Time ("13:00"), then clicks **Add Activity**.
2. **Frontend Logic (`schedule.js`):** `submitActivity()` reads the inputs, verifies that `activity_name` is not blank, builds `{ activity_name: "Coding Round 1", start_time: "10:00", end_time: "13:00" }`, and calls `callApi('POST', '/api/schedule/1', payload)`.
3. **HTTP Fetch (`common.js`):** `callApi()` uses `fetch()` to send an HTTP POST request with JSON payload to the Express route `/api/schedule/1`.
4. **Backend Route (`server/routes/schedule.js`):** `router.post('/:eventId')` receives `eventId = 1` from `req.params` and the payload from `req.body`.
5. **Partial Key Calculation:** The backend executes `SELECT MAX(schedule_id) AS lastId FROM event_schedule WHERE event_id = ?` with parameter `[1]`.
   - If no activities exist yet, `lastId` is `null`, so the next `schedule_id` is set to `1`.
   - If the event already has activities 1 and 2, `lastId` is `2`, so next `schedule_id` is set to `3`.
6. **Composite Key Insertion:** The backend executes:
   ```sql
   INSERT INTO event_schedule (event_id, schedule_id, activity_name, start_time, end_time)
   VALUES (?, ?, ?, ?, ?)
   ```
   with parameters `[1, 3, "Coding Round 1", "10:00", "13:00"]`.
7. **Database Execution:** MySQL inserts the row into `event_schedule`.
8. **JSON Response:** Express returns `{ success: true, sql: "...", params: [...], data: [{ event_id: 1, schedule_id: 3, message: "Activity added to schedule." }] }`.
9. **UI & Behind the Scenes Update:** `schedule.js` displays a green success notification, resets the input fields, calls `loadSchedule(1)` to refresh the table, and populates the **Behind the Scenes** panel with the query and parameters.

---

### B. SELECT Flow (Loading Events with Derived Status and Joins)
This demonstrates retrieving joined data and calculating a **derived attribute**:

1. **Trigger:** User opens `events.html`. The `window.onload` handler calls `loadEvents()`.
2. **Frontend Request:** `loadEvents()` in `events.js` executes `callApi('GET', '/api/events', null)`.
3. **Backend Processing:** In `server/routes/events.js`, the `router.get('/')` handler runs the 5-table `INNER JOIN` query.
4. **Derived Status Evaluation in MySQL:** The MySQL query engine computes:
   ```sql
   CASE
       WHEN event.event_date < CURDATE() THEN 'Completed'
       WHEN event.event_date = CURDATE() THEN 'Ongoing'
       ELSE 'Upcoming'
   END AS status
   ```
   comparing each row's `event_date` against the system's current date `CURDATE()`.
5. **Data Returned:** MySQL returns an array of event objects, each having `venue_name`, `organizer_name`, `club_name`, `category_name`, and the derived `status`.
6. **Express Response:** Express delivers `{ success: true, sql: "...", params: [], data: [ ...rows ] }`.
7. **DOM Table Rendering (`common.js`):** `events.js` formats the date, builds action buttons (Edit, Delete, Schedule), and invokes `buildTable()` to create the HTML `<table>`.
8. **Behind the Scenes:** The Behind the Scenes box displays the complete multi-line SQL join query and the resulting JSON.

---

## 4. Likely Viva Questions and Answers

### Q1: What is a Weak Entity, and why is `event_schedule` classified as one?
**Answer:** A weak entity is an entity that cannot be uniquely identified by its own attributes alone and depends on an owner (identifying) entity for its existence. `event_schedule` is a weak entity because `schedule_id` (e.g. Session 1, Session 2) is only meaningful in the context of a specific `event`. If the parent event is deleted, its schedule entries have no meaning and cannot exist alone.

### Q2: What is a Partial Key and what is the Primary Key of `event_schedule`?
**Answer:** `schedule_id` is a **partial key** (also called a discriminator) because it distinguishes activities only within one particular event, but is not globally unique across all events. To uniquely identify a schedule activity in the entire database, we combine the owner entity's key with the partial key to form a **composite primary key**: `(event_id, schedule_id)`.

### Q3: Why is `status` NOT stored as a column in the `event` table?
**Answer:** In database normalization, storing an attribute that can be calculated from another column violates database design best practices (storing redundant / derivable data). If `status` were stored as a physical column, it would become outdated whenever a day passes unless an external job constantly updates it. By calculating it on-the-fly using `CASE` and `CURDATE()`, the status is always **100% accurate and up-to-date** whenever queried.

### Q4: What is `ON DELETE CASCADE` and where is it used in your part?
**Answer:** `ON DELETE CASCADE` is a foreign key referential action. In `event_schedule`, the foreign key on `event_id` is defined with `ON DELETE CASCADE`:
```sql
FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE
```
When an event is deleted from the `event` table, MySQL automatically removes all related rows from `event_schedule` in the same transaction, preventing orphan schedule records without needing extra code.

### Q5: How do the dropdowns on the Events page connect Part 3 to Part 2?
**Answer:** In the ER diagram, an Event has foreign keys pointing to Venue (`venue_id`), Organizer (`organizer_id`), Club (`club_id`), and Category (`category_id`). In `events.js`, the `loadDropdowns()` function calls Part 2's master endpoints (`GET /api/venues`, `GET /api/organizers`, `GET /api/clubs`, `GET /api/categories`) and populates HTML `<select>` elements with `<option value="id">Name</option>` using `fillDropdown()`. When the user submits the form, the selected integer foreign keys are stored directly in `event`.

---

## 5. Files Owned by Member 3 (Ragini)

| File | Purpose |
|---|---|
| `server/routes/events.js` | Express API routes for events: 5-table JOIN with derived status `CASE`, and parameterized `POST`, `PUT`, `DELETE` |
| `server/routes/schedule.js` | Express API routes for weak entity schedule: `GET`, `POST` with `MAX(schedule_id) + 1` partial key computation, and composite key `DELETE` |
| `public/events.html` | User interface for events: Add/Edit event form, master foreign key dropdowns, events table, and derived status explanation |
| `public/events.js` | Frontend JavaScript for events: form handling, API integration via `callApi()`, edit/delete handlers, and table population |
| `public/schedule.html` | User interface for weak entity schedule: event selector, activity form, composite key explanation, and schedule timeline |
| `public/schedule.js` | Frontend JavaScript for schedule: event dropdown selection, auto-incrementing partial key submission, and timeline rendering |
| `docs/part3_explanation.md` | Comprehensive viva preparation document explaining entities, relationships, SQL queries, end-to-end data flow, and viva Q&A |
