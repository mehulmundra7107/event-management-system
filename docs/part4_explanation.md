# Part 4 Explanation Document
## Event Management System — Registrations, Feedback, Dashboard, Reports & Documentation
**Written by: Member 4**

---

## 1. ER Entities and Relationships Covered

Part 4 implements the transactional interactions of the system where students interact with events, as well as the analytical reporting and executive dashboard.

| Entity / Relationship in ER Diagram | Table(s) Used | Role in ER Diagram |
|---|---|---|
| **Registration** | `registration` | Resolves the **M:N relationship** between `Student` and `Event` (*Student registers for Event*). Enforces a `UNIQUE (student_id, event_id)` constraint so a student cannot register twice for the same event. |
| **Feedback** | `feedback` | Resolves the **M:N relationship** between `Student` and `Event` (*Student evaluates Event*). Enforces a `CHECK (rating BETWEEN 1 AND 5)` constraint on the rating score. |
| **Dashboard** | `student`, `event`, `registration`, `feedback`, `venue` | Aggregates high-level system metrics (total counts) and identifies immediate upcoming events using `CURDATE()`. |
| **Reports** | All system tables | Cross-entity analytical queries using `LEFT JOIN`, `INNER JOIN`, `COUNT`, `AVG`, `GROUP BY`, `ORDER BY`, and `LIMIT`. |

---

## 2. Table of SQL Queries in Part 4

All queries use parameterized placeholders (`?`) to prevent **SQL injection**, use multi-line formatting with one clause per line, and avoid non-standard database extensions.

| Query | What it does in one sentence | SQL Concept Demonstrated |
|---|---|---|
| `SELECT registration.registration_id, student.name AS student_name, event.event_name, registration.registration_date, registration.status FROM registration INNER JOIN student ON ... INNER JOIN event ON ... ORDER BY registration.registration_id DESC` | Fetches all registrations with student and event names. | Multi-table `INNER JOIN`, `ORDER BY` |
| `SELECT venue.capacity FROM venue INNER JOIN event ON event.venue_id = venue.venue_id WHERE event.event_id = ?` | Finds the seating capacity of the venue hosting a specific event. | `INNER JOIN`, Parameterized `WHERE` |
| `SELECT COUNT(*) AS total FROM registration WHERE registration.event_id = ?` | Counts current registered attendees for an event to verify capacity in JavaScript. | `COUNT` aggregate function, Parameterized `WHERE` |
| `INSERT INTO registration (student_id, event_id, registration_date, status) VALUES (?, ?, ?, ?)` | Adds a new registration record for a student and event. | Parameterized `INSERT`, `UNIQUE` constraint |
| `DELETE FROM registration WHERE registration_id = ?` | Cancels and removes an existing event registration. | Parameterized `DELETE`, `WHERE` |
| `SELECT feedback.feedback_id, student.name AS student_name, event.event_name, feedback.rating, feedback.comments, feedback.feedback_date FROM feedback INNER JOIN student ON ... INNER JOIN event ON ... ORDER BY feedback.feedback_id DESC` | Retrieves all student event feedback entries. | Multi-table `INNER JOIN`, `ORDER BY` |
| `SELECT ... FROM feedback INNER JOIN student ... WHERE feedback.event_id = ? ORDER BY feedback.feedback_id DESC` | Retrieves feedback entries filtered for a specific event. | `INNER JOIN`, Parameterized `WHERE` filter |
| `INSERT INTO feedback (student_id, event_id, rating, comments, feedback_date) VALUES (?, ?, ?, ?, ?)` | Inserts student evaluation and rating (1–5) for an event. | Parameterized `INSERT`, `CHECK` constraint |
| `SELECT COUNT(*) AS total FROM student` *(also for event, registration, feedback)* | Returns total count of records in a table for dashboard stat cards. | `COUNT` aggregate function |
| `SELECT event.event_id, event.event_name, event.event_date, event.start_time, venue.venue_name FROM event INNER JOIN venue ON ... WHERE event.event_date >= CURDATE() ORDER BY event.event_date ASC LIMIT 5` | Retrieves the next 5 upcoming events on or after today. | `INNER JOIN`, `CURDATE()`, `ORDER BY ASC`, `LIMIT` |
| `SELECT event.event_id, event.event_name, COUNT(registration.registration_id) AS total_registrations FROM event LEFT JOIN registration ON ... GROUP BY event.event_id, event.event_name ORDER BY total_registrations DESC` | Report 1: Counts registrations per event, including events with 0 registrations. | `LEFT JOIN`, `COUNT`, `GROUP BY`, `ORDER BY` |
| `SELECT event.event_id, event.event_name, AVG(feedback.rating) AS average_rating, COUNT(feedback.feedback_id) AS total_reviews FROM event INNER JOIN feedback ON ... GROUP BY event.event_id, event.event_name ORDER BY average_rating DESC` | Report 2: Computes average star rating per event. | `INNER JOIN`, `AVG`, `COUNT`, `GROUP BY` |
| `SELECT event.event_id, event.event_name, AVG(feedback.rating) AS average_rating, COUNT(...) FROM event INNER JOIN feedback ... GROUP BY ... ORDER BY average_rating DESC LIMIT 3` | Report 3: Identifies the top 3 rated events in the college. | `AVG`, `GROUP BY`, `ORDER BY DESC`, `LIMIT` |
| `SELECT club.club_id, club.club_name, COUNT(event.event_id) AS total_events FROM club LEFT JOIN event ON ... GROUP BY club.club_id, club.club_name ORDER BY total_events DESC` | Report 4: Measures event sponsorship count across all clubs. | `LEFT JOIN`, `COUNT`, `GROUP BY` |
| `SELECT event_category.category_id, event_category.category_name, COUNT(event.event_id) AS total_events FROM event_category LEFT JOIN event ON ... GROUP BY ... ORDER BY total_events DESC` | Report 5: Measures event distribution across categories. | `LEFT JOIN`, `COUNT`, `GROUP BY` |
| `SELECT event.event_id, event.event_name, venue.venue_name, venue.capacity, COUNT(registration.registration_id) AS registered_students FROM event INNER JOIN venue ON ... LEFT JOIN registration ON ... GROUP BY event.event_id, event.event_name, venue.venue_name, venue.capacity ORDER BY event.event_id` | Report 6: Compares venue capacity against registered attendee count. | 3-table JOIN (`INNER` + `LEFT`), `COUNT`, `GROUP BY` |
| `SELECT event.event_id, event.event_name, event.event_date, event.start_time, venue.venue_name, organizer.name AS organizer_name, club.club_name FROM event INNER JOIN venue ... INNER JOIN organizer ... INNER JOIN club ... WHERE event.event_date >= CURDATE() ORDER BY event.event_date ASC` | Report 7: Complete schedule sheet for all upcoming events. | 4-table `INNER JOIN`, `WHERE`, `CURDATE()` |
| `SELECT event.event_id, event.event_name, event.event_date, club.club_name FROM event INNER JOIN club ON ... LEFT JOIN registration ON ... WHERE registration.registration_id IS NULL ORDER BY event.event_date` | Report 8: Finds events that have zero registrations. | `LEFT JOIN`, `WHERE ... IS NULL` (anti-join pattern) |
| `SELECT student.name AS student_name, event.event_name, event.event_date, registration.registration_date, registration.status FROM registration INNER JOIN student ON ... INNER JOIN event ON ... WHERE registration.student_id = ? ORDER BY registration.registration_date DESC` | Report 9: History of all events a specific student attended/registered for. | 3-table `INNER JOIN`, Parameterized `WHERE` |

---

## 3. Step-by-Step Flow

### A. INSERT Flow with Capacity & Constraint Validation (Registering a Student)
1. **User Action:** On `registrations.html`, user selects Student (e.g. "Sneha Patil"), Event (e.g. "Startup Pitch Day"), verifies today's date, and clicks **Register Student**.
2. **Client Script (`registrations.js`):** `submitRegistration()` reads the values, validates that student and event are selected, and calls `callApi('POST', '/api/registrations', { student_id: 3, event_id: 6, registration_date: '2026-10-15' })`.
3. **HTTP Dispatch (`common.js`):** `callApi()` issues an HTTP POST request carrying JSON body to Express at `http://localhost:3000/api/registrations`.
4. **Backend Route (`server/routes/registrations.js`):**
   - Query 1: Checks venue capacity:
     ```sql
     SELECT venue.capacity FROM venue INNER JOIN event ON event.venue_id = venue.venue_id WHERE event.event_id = 6
     ```
   - Query 2: Checks total current registrations for event 6:
     ```sql
     SELECT COUNT(*) AS total FROM registration WHERE registration.event_id = 6
     ```
   - Capacity Check: If `total >= capacity`, the backend halts and returns `{ success: false, message: "Event is full." }`.
   - Insertion: If seats remain, runs `INSERT INTO registration (student_id, event_id, registration_date, status) VALUES (?, ?, ?, ?)`.
5. **MySQL Processing:**
   - If the student has not yet registered for this event, the row is inserted, and MySQL returns `result.insertId`.
   - If the student was already registered, MySQL's `UNIQUE (student_id, event_id)` constraint triggers error code `ER_DUP_ENTRY`. The catch block intercepts this code and returns friendly message: `"This student is already registered for this event."`.
6. **Frontend Update:**
   - On success: `showMessage()` renders a green success banner, clears the form, and calls `loadRegistrations()` to reload the live table.
   - On duplicate or capacity error: `showMessage()` displays the error message in red.
   - The dark **Behind the Scenes** box updates with the executed SQL, parameters, and server JSON.

---

### B. SELECT Flow (Generating an Analytical Report & Exporting to CSV)
1. **User Action:** On `reports.html`, user selects "6. Venue Usage & Capacity (3-table JOIN, COUNT, GROUP BY)" and clicks **Generate Report**.
2. **Client Script (`reports.js`):** `runReport()` detects `venue-usage` and calls `callApi('GET', '/api/reports/venue-usage', null)`.
3. **Backend Execution:** Route handler runs the 3-table join query grouping by event and venue columns.
4. **MySQL Return:** MySQL executes the query, aggregates the counts, and returns an array of result objects.
5. **Client Presentation:**
   - The report title and timestamp (*Report generated on: ...*) are rendered above the table.
   - `buildTable()` dynamically builds the HTML table with styled headers.
   - The **Behind the Scenes** panel displays the multi-table query and raw JSON.
   - The **Download CSV** and **Print / Save as PDF** buttons become active.
6. **CSV Export:** Clicking **Download CSV** triggers `downloadCSV()`, which converts the array of rows into a comma-separated text string, instantiates a `Blob`, and automatically downloads `venue-usage.csv` to the user's computer.

---

## 4. Likely Viva Questions and Answers

### Q1: How is the Many-to-Many (M:N) relationship between Student and Event represented in MySQL?
**Answer:** In relational design, a Many-to-Many relationship cannot be represented directly with foreign keys in either parent table. We resolve it by introducing an associative table (also called a junction or bridge table) named `registration`. It contains `student_id` (foreign key to `student`) and `event_id` (foreign key to `event`). Each row in `registration` represents one registration instance. A second M:N relationship (*Student evaluates Event*) is similarly resolved via the `feedback` table.

### Q2: How is duplicate registration prevented, and how does the UI demonstrate it?
**Answer:** The `registration` table defines a composite unique constraint: `UNIQUE (student_id, event_id)`. If an insert attempt is made with an existing student and event pair, MySQL rejects the query with error `ER_DUP_ENTRY`. In `server/routes/registrations.js`, we intercept this error and return `"This student is already registered for this event."` which `showMessage()` renders in a red warning box.

### Q3: Why is venue capacity checked in Node.js JavaScript rather than a database trigger?
**Answer:** According to course project guidelines, we avoid database triggers and stored procedures so that first-year students can clearly understand and explain the complete application logic in readable code. Checking capacity in Node.js requires two simple, transparent SELECT queries (one for venue capacity and one for attendee count) followed by a standard `if (total >= capacity)` condition, demonstrating procedural control flow before issuing the `INSERT`.

### Q4: What is the difference between INNER JOIN and LEFT JOIN in the Reports module?
**Answer:**
- **`INNER JOIN`** returns only rows that have matching records in both tables. For example, in `average-rating-per-event`, only events that actually have feedback entries are returned.
- **`LEFT JOIN`** returns all rows from the left table, even if there is no matching record in the right table (unmatched columns are filled with `NULL`). For example, in `registrations-per-event`, `event LEFT JOIN registration` ensures that events with 0 registrations still appear with a count of 0 instead of being omitted. Similarly, in `events-with-no-registrations`, we use `LEFT JOIN ... WHERE registration.registration_id IS NULL` to isolate events without attendees.

### Q5: Why must non-aggregated columns be included in the GROUP BY clause in MySQL 8?
**Answer:** Under MySQL 8's default SQL mode (`ONLY_FULL_GROUP_BY`), every column in the `SELECT` list that is not part of an aggregate function (such as `COUNT()` or `AVG()`) must be explicitly named in the `GROUP BY` clause. Omitting them causes MySQL error `ER_WRONG_FIELD_WITH_GROUP`. In our queries, whenever we select `event.event_id` and `event.event_name`, we explicitly write `GROUP BY event.event_id, event.event_name` to ensure deterministic, standard-compliant SQL execution.

---

## 5. Files Owned by Member 4

| File Path | Description |
|---|---|
| `server/routes/registrations.js` | Express router for registration endpoints (`GET`, `POST` with capacity check and unique error catch, `DELETE`, and event list helper). |
| `server/routes/feedback.js` | Express router for feedback endpoints (`GET /`, `GET /event/:eventId`, `POST` with 1–5 rating check). |
| `server/routes/dashboard.js` | Express router for dashboard summary counts (students, events, registrations, feedback) and upcoming events. |
| `server/routes/reports.js` | Express router executing all 9 analytical SQL reports via an `if / else if` chain. |
| `public/index.html` | Dashboard HTML view featuring 4 colored stat cards and upcoming events table. |
| `public/index.js` | Dashboard frontend controller fetching metric counts and rendering upcoming events. |
| `public/registrations.html` | Event registration HTML view with student/event dropdowns, registration date, and list table. |
| `public/registrations.js` | Frontend controller for registrations handling form submission, error banners, and deletion. |
| `public/feedback.html` | Event feedback HTML view with 1–5 rating selector, event filter dropdown, and feedback table. |
| `public/feedback.js` | Frontend controller for feedback handling event filtering, rating validation, and submission. |
| `public/reports.html` | Reports HTML view with report selector, student picker, print button, and CSV download button. |
| `public/reports.js` | Frontend controller executing reports, building formatted tables, and handling CSV Blob export and print. |
| `README.md` | Main repository README detailing architecture, setup, folder structure, and team matrix. |
| `docs/part4_explanation.md` | This viva preparation and architectural explanation document for Part 4. |
| `docs/demo_script.md` | Comprehensive 7-step presentation and demo script for the project guide/examiner. |
