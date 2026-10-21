# Event Management System — 7-Step Viva Demonstration Script
**Project Guide & Examiner Presentation Guide**
**Prepared by: Member 4**

---

## Overview

This demonstration script provides a structured, 7-step walkthrough designed to present our DBMS project to the course guide and external examiner. It systematically proves that our web frontend, Node.js Express backend, and MySQL database interact seamlessly, enforce relational constraints, maintain referential integrity, and generate analytical reports.

---

## Step 1: Showcase the ER Diagram & Relational Schema in MySQL Workbench

- **Objective:** Establish the foundational ER model and prove that all 11 tables exist with proper constraints in MySQL.
- **Action:**
  1. Open **MySQL Workbench** and connect to the local server.
  2. In the Navigator pane, expand `event_management` -> `Tables`.
  3. Show the table list: `student`, `student_phone`, `club`, `organizer`, `organizer_phone`, `venue`, `event_category`, `event`, `event_schedule`, `registration`, `feedback`.
  4. Open the EER Diagram (Database -> Reverse Engineer) or show the table definitions.
- **What to Say to the Guide:**
  > *"Good morning/afternoon, Sir/Madam. Here is the relational schema of our college Event Management System. It consists of 11 normalized tables. Notice that the central entity is `event`, which has foreign keys pointing to `venue`, `organizer`, `club`, and `category`. Notice two multivalued attributes (`student_phone` and `organizer_phone`) split into separate tables to satisfy First Normal Form. Also, `event_schedule` is a weak entity with composite primary key `(event_id, schedule_id)` and `ON DELETE CASCADE`. The two Many-to-Many relationships—students registering for events and students giving feedback—are resolved by the `registration` and `feedback` bridge tables."*
- **What to Point Out:**
  - Foreign key constraints (`RESTRICT` by default, `CASCADE` on schedule).
  - `UNIQUE (student_id, event_id)` constraint in the `registration` table definition.
  - `CHECK (rating BETWEEN 1 AND 5)` constraint in the `feedback` table definition.

---

## Step 2: Insert a New Student & Inspect the Live SQL Execution

- **Objective:** Demonstrate frontend-to-backend data flow, parameterized SQL INSERT, handling multivalued attributes, and the "Behind the Scenes" inspection panel.
- **Action:**
  1. In the browser, navigate to `http://localhost:3000/students.html`.
  2. Fill in the form:
     - **Full Name:** `Rahul Sharma`
     - **Email Address:** `rahul.sharma@student.edu`
     - **Department:** `CSE`
     - **Year:** `2`
     - **Phone Number 1:** `9811122233`
     - **Phone Number 2:** `9822233344`
  3. Click **Add Student**.
- **What to Say to the Guide:**
  > *"When we click 'Add Student', the frontend does not talk to MySQL directly because browsers cannot open TCP database sockets. Instead, vanilla JavaScript reads the inputs, builds a JSON object, and sends a POST request using `fetch()` to our Express backend. Express executes a parameterized INSERT query with `?` placeholders to prevent SQL injection. It takes the newly generated `insertId` and inserts both phone numbers into `student_phone`."*
- **What to Point Out:**
  - The green success message: *"Student added successfully!"*.
  - Scroll down to the **Behind the Scenes** panel: Point out the parameterized SQL `INSERT INTO student (name, email, department, year) VALUES (?, ?, ?, ?)`, the parameter array `["Rahul Sharma", "rahul.sharma@student.edu", "CSE", 2]`, and the returned JSON with `student_id`.
  - Switch to MySQL Workbench and run: `SELECT * FROM student WHERE email = 'rahul.sharma@student.edu';` to verify the new row is live in the database.

---

## Step 3: Retrieve and Display the Student List (Multivalued Attribute Demo)

- **Objective:** Demonstrate SELECT queries, dynamic DOM table construction, and retrieving multivalued attributes on demand.
- **Action:**
  1. Look at the **List of Students** table on `students.html`.
  2. Locate the row for `Rahul Sharma` or `Asha Verma`.
  3. Click the **View Phones** button on that row.
- **What to Say to the Guide:**
  > *"On page load, `loadStudents()` issues a GET request to `/api/students`. Express runs `SELECT * FROM student ORDER BY student_id` and returns an array of objects, which our helper function `buildTable()` dynamically renders into an HTML table. When we click 'View Phones', it fires a secondary query: `SELECT * FROM student_phone WHERE student_id = ?`. This demonstrates the multivalued attribute concept from our ER diagram where a single student can possess multiple phone numbers stored in a separate table."*
- **What to Point Out:**
  - The sub-panel opening under the table displaying the student's phone numbers.
  - The Behind the Scenes box showing the `SELECT * FROM student_phone WHERE student_id = ?` query.

---

## Step 4: Register a Student & Demonstrate the UNIQUE Constraint Violation

- **Objective:** Demonstrate transactional insertion into an M:N bridge table and show how database constraints prevent duplicate data.
- **Action:**
  1. In the navbar, click **Registrations** (`http://localhost:3000/registrations.html`).
  2. In the form, select:
     - **Student:** `Sneha Patil` (Student ID 3)
     - **Event:** `Startup Pitch Day` (Event ID 6)
  3. Click **Register Student**.
  4. Note the green success message: *"Student registered successfully!"*.
  5. Without changing the selections, click **Register Student** a second time.
- **What to Say to the Guide:**
  > *"Student registration represents a Many-to-Many relationship between students and events. When Sneha registers for Startup Pitch Day, a new record is added to the `registration` table. If we attempt to register Sneha for the exact same event again, MySQL rejects the insertion because of our `UNIQUE (student_id, event_id)` constraint and throws error code `ER_DUP_ENTRY`. Our backend catches this specific error and returns a human-friendly message."*
- **What to Point Out:**
  - The red warning message: *"This student is already registered for this event."*.
  - Show the guide the `registration` schema definition in `schema.sql` line 149: `UNIQUE (student_id, event_id)`.

---

## Step 5: Fill an Event to Capacity & Demonstrate Venue Capacity Enforcement

- **Objective:** Demonstrate procedural business logic in Node.js checking venue capacity against live registration counts without relying on complex database triggers.
- **Action:**
  1. Open MySQL Workbench and run:
     ```sql
     -- Find an event with a smaller capacity venue or temporarily set capacity to current registration count
     SELECT event.event_id, event.event_name, venue.capacity, COUNT(registration.registration_id) AS current_regs
     FROM event
     INNER JOIN venue ON event.venue_id = venue.venue_id
     LEFT JOIN registration ON event.event_id = registration.event_id
     GROUP BY event.event_id, event.event_name, venue.capacity;
     ```
  2. For demonstration, choose an event (e.g., Event ID 3: `ENTC Workshop: PCB Design` which has 2 registrations). In Workbench, update its venue capacity to 2:
     ```sql
     UPDATE venue SET capacity = 2 WHERE venue_id = 2;
     ```
  3. Return to `registrations.html` in the browser.
  4. Select an unregistered student (e.g., `Amit Sharma`) and select `ENTC Workshop: PCB Design`.
  5. Click **Register Student**.
- **What to Say to the Guide:**
  > *"Before writing an insertion to `registration`, our backend performs a capacity check in Node.js. It executes two queries: first, `SELECT capacity FROM venue INNER JOIN event ...` to check the venue's physical limit, and second, `SELECT COUNT(*) AS total FROM registration ...` to count existing attendees. When total registrations equal or exceed venue capacity, the backend halts and returns 'Event is full.' without corrupting the database. This enforces physical venue limits cleanly."*
- **What to Point Out:**
  - The red error message displayed under the form: *"Event is full."*.
  - Revert the venue capacity in Workbench: `UPDATE venue SET capacity = 120 WHERE venue_id = 2;`.

---

## Step 6: Generate Analytical SQL Reports, Download CSV & Print to PDF

- **Objective:** Demonstrate complex SQL reporting (multi-table joins, aggregations, GROUP BY, anti-joins) and clean data export capabilities.
- **Action:**
  1. In the navbar, click **Reports** (`http://localhost:3000/reports.html`).
  2. Select and generate the following 3 reports sequentially:
     - **Report 1: Registrations per Event (LEFT JOIN, COUNT, GROUP BY):**
       - Click **Generate Report**.
       - Explain: Events with 0 registrations (like `Drama Auditions`) still show up with `0` because of `LEFT JOIN`.
     - **Report 6: Venue Usage & Capacity (3-table JOIN, COUNT, GROUP BY):**
       - Click **Generate Report**.
       - Explain: Compares venue physical seating capacity directly with live registration counts.
     - **Report 8: Events with No Registrations (LEFT JOIN, WHERE IS NULL):**
       - Click **Generate Report**.
       - Explain: Uses the anti-join pattern (`LEFT JOIN ... WHERE registration.registration_id IS NULL`) to identify events that need publicity.
  3. Click the **Download CSV** button on any report to show the instant CSV download.
  4. Click the **Print / Save as PDF** button.
- **What to Say to the Guide:**
  > *"Our reports module executes real analytical queries across multiple joined tables. In MySQL 8, all non-aggregated columns in the SELECT clause are explicitly declared in the GROUP BY clause to comply with standard SQL. Notice when we click 'Print', our custom `@media print` CSS rule hides the navbar, form buttons, and Behind the Scenes box, providing an executive PDF report."*
- **What to Point Out:**
  - The printed header showing report title and timestamp (*Report generated on: ...*).
  - The Behind the Scenes box displaying the multi-table SQL query and parameters.
  - The clean browser print preview with navigation and forms stripped out.

---

## Step 7: Demonstrate Derived Event Status (Upcoming / Ongoing / Completed)

- **Objective:** Demonstrate the concept of derived attributes—attributes that are computed dynamically in queries rather than redundantly stored in table columns.
- **Action:**
  1. In the navbar, click **Events** (`http://localhost:3000/events.html`).
  2. Show the **List of Events** table.
  3. Locate the **Status** column showing `Completed`, `Ongoing`, and `Upcoming`.
  4. Point out the note on the page: *"Status is derived dynamically using CURDATE(), not stored as a column."*
  5. Show the SQL query in the **Behind the Scenes** panel:
     ```sql
     CASE
         WHEN event.event_date < CURDATE() THEN 'Completed'
         WHEN event.event_date = CURDATE() THEN 'Ongoing'
         ELSE 'Upcoming'
     END AS status
     ```
- **What to Say to the Guide:**
  > *"In our ER diagram, Event Status is a derived attribute. In accordance with database normalization principles, storing status as a column would introduce data redundancy and require daily batch updates. Instead, our SELECT query calculates status on the fly using a SQL `CASE` expression evaluated against MySQL's `CURDATE()`. Past dates evaluate to 'Completed', today's date evaluates to 'Ongoing', and future dates evaluate to 'Upcoming'. This concludes our 7-step system demonstration."*

---

## Summary Checklist for Viva Presentation

- [x] Step 1: ER Diagram and 11 normalized tables in MySQL Workbench.
- [x] Step 2: Student INSERT with parameters & live row inspection.
- [x] Step 3: Student list retrieval & multivalued phone display.
- [x] Step 4: Registration insertion & `UNIQUE (student_id, event_id)` constraint catch.
- [x] Step 5: Capacity verification logic in backend returning `"Event is full."`.
- [x] Step 6: 3 SQL reports demonstrated, CSV exported, and print preview opened.
- [x] Step 7: Derived event status verified via `CASE` and `CURDATE()`.
