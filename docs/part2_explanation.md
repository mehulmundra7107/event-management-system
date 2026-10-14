# Part 2 Explanation Document
## Event Management System — Master Data Module
**Written by: Member 2**

---

## 1. ER Entities and Relationships Covered

The Master Data module covers the core catalog entities that describe where, how, and by whom college events are hosted. In the ER diagram, these entities exist independently and are referenced by the central `event` entity via foreign keys.

| Entity / Relationship in ER Diagram | Table(s) Used | Role in ER Diagram |
|---|---|---|
| **Venue** | `venue` | **Hosts** Event (`1:N` relationship: one venue hosts many events). Stores venue name, location, and total seating capacity. |
| **Organizer** | `organizer` | **Organizes** Event (`1:N` relationship: one organizer coordinates many events). Stores faculty/student organizer details. |
| **Phone** (Multivalued Attribute) | `organizer_phone` | Multivalued attribute of Organizer. An organizer may have multiple phone numbers, separated into its own table to satisfy **First Normal Form (1NF)**. |
| **Club / Committee** | `club` | **Sponsors** Event (`1:N` relationship: one club sponsors many events). |
| **Event Category** | `event_category` | Event **Belongs To** Category (`N:1` relationship: each event belongs to a single category like Technical, Cultural, etc.). |

> **Dependency Note:** Member 3 (Events module) relies directly on Part 2's `GET` routes (`/api/venues`, `/api/organizers`, `/api/clubs`, `/api/categories`) to populate dropdown menus when creating and updating events.

---

## 2. SQL Queries in Part 2

Every query in Part 2 strictly follows the course project guidelines: multi-line formatting, parameterized placeholders (`?`), and clear beginner-level clauses.

| Query | What it does in one sentence | SQL Concept Demonstrated |
|---|---|---|
| `SELECT venue_id, venue_name, location, capacity FROM venue ORDER BY venue_id` | Retrieves all venues sorted by ID for display and dropdowns. | `SELECT`, `ORDER BY` |
| `INSERT INTO venue (venue_name, location, capacity) VALUES (?, ?, ?)` | Adds a new physical venue with seating capacity. | Parameterized `INSERT` |
| `DELETE FROM venue WHERE venue_id = ?` | Removes a venue by ID (blocked if referenced by events). | `DELETE`, `WHERE` |
| `SELECT organizer_id, name, email, department_club FROM organizer ORDER BY organizer_id` | Retrieves all registered organizers in ascending ID order. | `SELECT`, `ORDER BY` |
| `INSERT INTO organizer (name, email, department_club) VALUES (?, ?, ?)` | Inserts a new organizer and generates an `insertId`. | Parameterized `INSERT`, `AUTO_INCREMENT` |
| `SELECT phone_id, organizer_id, phone FROM organizer_phone WHERE organizer_id = ?` | Fetches all phone numbers belonging to a specific organizer. | `SELECT`, `WHERE`, Multivalued attribute lookup |
| `INSERT INTO organizer_phone (organizer_id, phone) VALUES (?, ?)` | Inserts an organizer phone linked to the parent organizer ID. | `INSERT` with Foreign Key binding |
| `DELETE FROM organizer_phone WHERE organizer_id = ?` | Removes child phone records when an organizer is deleted. | `DELETE`, `WHERE`, Child record cleanup |
| `DELETE FROM organizer WHERE organizer_id = ?` | Deletes an organizer record by ID. | `DELETE`, `WHERE` |
| `SELECT club_id, club_name, description, contact_email FROM club ORDER BY club_id` | Retrieves all clubs and committees. | `SELECT`, `ORDER BY` |
| `INSERT INTO club (club_name, description, contact_email) VALUES (?, ?, ?)` | Inserts a new student club or organizing committee. | Parameterized `INSERT` |
| `DELETE FROM club WHERE club_id = ?` | Deletes a club by ID (blocked if referenced by events). | `DELETE`, `WHERE` |
| `SELECT category_id, category_name, description FROM event_category ORDER BY category_id` | Retrieves all categories (Technical, Cultural, etc.). | `SELECT`, `ORDER BY` |
| `INSERT INTO event_category (category_name, description) VALUES (?, ?)` | Adds a new event classification category. | Parameterized `INSERT` |
| `DELETE FROM event_category WHERE category_id = ?` | Deletes an event category by ID. | `DELETE`, `WHERE` |

### Preventing SQL Injection
Every query uses `?` placeholders instead of concatenating raw strings (e.g. `VALUES ('" + name + "')`). This prevents **SQL Injection** attacks because the MySQL database engine compiles the query template first, and the values are safely passed as distinct parameters without being interpreted as executable SQL statements.

---

## 3. Step-by-Step Flow

### A. INSERT Flow (Adding an Organizer with Phone Numbers)
This demonstrates inserting a parent entity and its multivalued attribute child records:

1. **User Input:** The user fills the form on `master.html` (Name: "Prof. Anand Deshmukh", Email: "anand.d@college.edu", Dept: "CSE", Primary Phone: "9876543210", Secondary Phone: "9123456780") and clicks **Add Organizer**.
2. **Frontend Validation & Extraction (`master.js`):** The `submitOrganizer()` function reads inputs with `document.getElementById(...).value.trim()` and validates that required fields are present.
3. **HTTP Fetch (`common.js`):** `callApi('POST', '/api/organizers', organizerObject)` serializes the data to JSON and sends an HTTP POST request to the Express backend.
4. **Backend Route (`server/routes/master.js`):** The `router.post('/organizers')` handler receives the data in `req.body`.
5. **Parent Table Insertion:** The server executes `INSERT INTO organizer (name, email, department_club) VALUES (?, ?, ?)` using MySQL2.
6. **Retrieving `insertId`:** MySQL inserts the row and returns `result.insertId` (e.g., ID `7`).
7. **Child Table Insertion:** The server executes `INSERT INTO organizer_phone (organizer_id, phone) VALUES (?, ?)` for `phone1`, and repeats for `phone2` using the new `organizer_id` (`7`).
8. **JSON Response:** Express responds with `{ success: true, sql: "...", params: [...], data: [{ organizer_id: 7, message: "Organizer and phone(s) added successfully." }] }`.
9. **UI Refresh & Behind the Scenes:** The browser shows a green success banner, clears the form inputs, calls `loadOrganizers()` to refresh the table, and populates the **Behind the Scenes** inspection box with the query, parameters, and response.

---

### B. SELECT Flow (Loading Venues on Page Load)
This demonstrates how backend master data is retrieved and rendered on screen:

1. **Trigger:** `window.onload` triggers in `master.js` when the page finishes loading, calling `loadVenues()`.
2. **HTTP Fetch:** `loadVenues()` calls `callApi('GET', '/api/venues', null)`.
3. **Backend Execution:** Express route `router.get('/venues')` runs `SELECT venue_id, venue_name, location, capacity FROM venue ORDER BY venue_id`.
4. **Database Return:** MySQL queries the `venue` table and returns an array of row objects.
5. **JSON Delivery:** Express replies with `{ success: true, sql: "...", params: [], data: [ ...venues ] }`.
6. **Action Buttons Attachment:** In `master.js`, JavaScript loops through the returned rows and attaches an HTML Delete button (`<button class="btn-danger" onclick="deleteVenue(...)">Delete</button>`) to each object.
7. **Table Construction (`common.js`):** `buildTable('venues-table-container', columnNames, rows)` dynamically creates an HTML `<table>` element with matching `<thead>` and `<tbody>` rows.
8. **Render:** The user sees the structured venue table with live database data.

---

## 4. Likely Viva Questions and Answers

### Q1: What is "Master Data" and why is it separated into its own module?
**Answer:** Master data represents non-transactional, foundational reference data that rarely changes and is shared across the entire system (such as Venues, Clubs, Categories, and Organizers). Separating master data ensures data consistency, avoids redundant entry, and allows transactional tables like `event` to simply reference these entities using foreign keys.

### Q2: Why is `organizer_phone` a separate table instead of a column in `organizer`?
**Answer:** In the ER diagram, an organizer's phone number is a **multivalued attribute** because one organizer may have multiple phone numbers. Storing comma-separated phone numbers in a single column violates **First Normal Form (1NF)**, which requires atomic values. Creating `organizer_phone(phone_id, organizer_id FK, phone)` normalizes the database and allows each phone number to be queried independently.

### Q3: What happens if an examiner clicks "Delete" on a Venue that already has events scheduled?
**Answer:** MySQL will reject the deletion by returning error code `ER_ROW_IS_REFERENCED_2`. This occurs because `event.venue_id` has a foreign key referencing `venue.venue_id` with default `RESTRICT` behavior. Our `getFriendlyError()` function catches this exception and displays: *"Cannot delete: other records depend on this one."* This demonstrates **referential integrity** enforcement by the DBMS.

### Q4: Why is Venue Capacity validated on both the client (browser) and server (Express)?
**Answer:** 
- **Client-side validation** (`min="1"` in HTML and `isNaN(capacity) || capacity <= 0` in `master.js`) provides immediate feedback to the user without unnecessary network traffic.
- **Server-side validation** in `routes/master.js` is essential for database integrity and security, as a client can bypass browser checks (e.g., using Postman, curl, or browser dev tools).

### Q5: How does Part 3 (Event Module) make use of Part 2's API routes?
**Answer:** When creating a new event, Member 3 needs to select an existing venue, organizer, club, and category. Rather than typing raw IDs manually, Part 3 calls `GET /api/venues`, `GET /api/organizers`, `GET /api/clubs`, and `GET /api/categories` to populate HTML `<select>` dropdowns using `fillDropdown()`.

---

## 5. Files Owned by Member 2

| File Path | Description |
|---|---|
| `server/routes/master.js` | Express router implementing all master data endpoints (`GET`, `POST`, `DELETE` for venues, organizers, clubs, categories, and `GET /organizers/:id/phones`). |
| `public/master.html` | HTML view featuring four distinct visual sections/cards for Venues, Organizers, Clubs, and Categories, along with the Behind the Scenes box. |
| `public/master.js` | Frontend controller handling form input extraction, client-side validation (capacity > 0), API communication via `callApi`, table rendering, and phone viewing. |
| `docs/part2_explanation.md` | Comprehensive viva preparation and architectural explanation document for Part 2. |
