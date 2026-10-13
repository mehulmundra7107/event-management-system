# Part 1 Explanation Document
## Event Management System — Foundation + Student Module
**Written by: Member 1**

---

## 1. ER Entities and Relationships Covered

| Entity / Relationship | Table(s) Created |
|---|---|
| **Student** (ER entity) | `student` |
| **Phone** (multivalued attribute of Student) | `student_phone` |
| All other ER entities (foundation) | `club`, `organizer`, `organizer_phone`, `venue`, `event_category`, `event`, `event_schedule`, `registration`, `feedback` |

Part 1 also creates the **complete database schema** (all 11 tables) and **sample data** so other members can start with real data.

---

## 2. SQL Queries in Part 1

| Query | What it does | SQL Concept |
|---|---|---|
| `SELECT * FROM student ORDER BY student_id` | Gets all students in order of their ID | SELECT, ORDER BY |
| `SELECT * FROM student_phone WHERE student_id = ?` | Gets all phone numbers for one student | SELECT, WHERE, parameterized query |
| `INSERT INTO student (name, email, department, year) VALUES (?, ?, ?, ?)` | Adds a new student row | INSERT with parameterized values |
| `INSERT INTO student_phone (student_id, phone) VALUES (?, ?)` | Adds a phone number for a student | INSERT with foreign key value |
| `UPDATE student SET name=?, email=?, department=?, year=? WHERE student_id=?` | Changes a student's details | UPDATE with WHERE |
| `DELETE FROM student WHERE student_id = ?` | Removes a student by ID | DELETE with WHERE |

**Note on parameterized queries:** Every query uses `?` placeholders instead of putting values directly into the SQL string. This **prevents SQL injection** — a security attack where a user types SQL code into a form field to manipulate the database.

---

## 3. Step-by-Step Flow

### INSERT (Adding a student)

1. **Form**: User fills in name, email, department, year, phone1, phone2 in `students.html` and clicks "Add Student".
2. **JavaScript** (`students.js`, function `submitStudent()`): Reads the values with `document.getElementById(...).value`, builds a plain object `{ name: ..., email: ..., ... }`.
3. **fetch** (`common.js`, function `callApi()`): Sends a `POST` request to `http://localhost:3000/api/students` with the object as a JSON body.
4. **Express route** (`routes/students.js`): `router.post('/')` receives the request. `req.body` contains the object. It runs the parameterized `INSERT INTO student ...` query.
5. **MySQL**: Inserts the row. Returns an object with `insertId` (the new `student_id`).
6. **Express**: Uses `insertId` to INSERT each phone into `student_phone`. Then sends back `{ success: true, sql: ..., params: ..., data: [...] }`.
7. **JavaScript**: Receives the JSON. Calls `showMessage()` to show "Student added successfully!" in green. Calls `loadStudents()` which re-runs the GET request and calls `buildTable()` to update the displayed table.
8. **Behind the Scenes box**: `showBehindTheScenes()` fills the dark box with the SQL, the parameters, and the raw JSON.

### SELECT (Loading the student list)

1. **JavaScript** calls `callApi('GET', '/api/students', null)` on page load.
2. **fetch**: Sends a `GET` request. No body needed.
3. **Express route**: Runs `SELECT * FROM student ORDER BY student_id`.
4. **MySQL**: Returns all rows as an array.
5. **Express**: Sends `{ success: true, sql: ..., data: [array of student objects] }`.
6. **JavaScript**: Calls `buildTable('students-table-container', columnNames, rows)`.
7. **buildTable()** (`common.js`): Loops through the rows array and builds an HTML `<table>` with one `<tr>` per student.
8. **Browser**: Displays the table to the user.

---

## 4. Likely Viva Questions and Answers

**Q1: Why can't the browser connect to MySQL directly? Why do we need Node.js/Express?**

A: Browsers are sandboxed for security. They cannot open raw TCP connections to databases. Express runs on the server where MySQL also lives. The browser talks to Express over HTTP, and Express talks to MySQL using the `mysql2` library.

**Q2: What is a connection pool (in db.js)?**

A: Instead of opening and closing a new database connection for every request (which is slow), a pool keeps several connections open and reuses them. `mysql.createPool()` manages this automatically.

**Q3: Why do we use `?` in SQL queries instead of putting values directly?**

A: To prevent **SQL injection**. If a user types `'; DROP TABLE student; --` into the name field and we insert that directly into the SQL string, the database would run that malicious command. With `?` placeholders, the `mysql2` library escapes the value safely before sending it to MySQL.

**Q4: What is the multivalued attribute and how do we store it?**

A: A student can have more than one phone number. In ER design, this is called a **multivalued attribute**. Since a relational table can only store one value per cell, we create a separate table `student_phone` with a foreign key pointing to `student`. Each phone is stored as a separate row.

**Q5: What happens when you try to delete a student who has registrations?**

A: MySQL raises an `ER_ROW_IS_REFERENCED_2` error because `registration.student_id` has a foreign key pointing to `student.student_id` with `RESTRICT` behaviour. Our `getFriendlyError()` function catches this and shows the user: *"Cannot delete: other records depend on this one."* This demonstrates **referential integrity**.

---

## 5. Files Owned by Member 1

| File | Purpose |
|---|---|
| `database/schema.sql` | All 11 table definitions with comments |
| `database/sample_data.sql` | Sample rows for all tables |
| `server/package.json` | Node.js project config and dependencies |
| `server/.env.example` | Template for environment variables |
| `.gitignore` | Excludes node_modules and .env from Git |
| `server/db.js` | MySQL2 connection pool |
| `server/server.js` | Express app entry point |
| `server/routes/students.js` | Student API routes (GET, POST, PUT, DELETE, phones) |
| `server/routes/master.js` | Placeholder for Member 2 |
| `server/routes/events.js` | Placeholder for Member 3 |
| `server/routes/schedule.js` | Placeholder for Member 3 |
| `server/routes/registrations.js` | Placeholder for Member 4 |
| `server/routes/feedback.js` | Placeholder for Member 4 |
| `server/routes/reports.js` | Placeholder for Member 4 |
| `server/routes/dashboard.js` | Placeholder for Member 4 |
| `public/style.css` | Shared CSS for all pages |
| `public/common.js` | Shared JS helper functions |
| `public/students.html` | Student page HTML |
| `public/students.js` | Student page JavaScript |
| `public/index.html` | Placeholder for Member 4 (Dashboard) |
| `public/master.html` | Placeholder for Member 2 |
| `public/events.html` | Placeholder for Member 3 |
| `public/schedule.html` | Placeholder for Member 3 |
| `public/registrations.html` | Placeholder for Member 4 |
| `public/feedback.html` | Placeholder for Member 4 |
| `public/reports.html` | Placeholder for Member 4 |
| `docs/part1_explanation.md` | This document |
