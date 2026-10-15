# Event Management System (DBMS Course Project)

A simple, complete college **Event Management System** built for a DBMS course project.

The primary goal of this project is to clearly demonstrate how a web frontend communicates with a backend server, how parameterized queries are executed against a MySQL database, how relational constraints and referential integrity are enforced, and how analytical reports are generated.

---

## 1. Project Overview & Architecture

The application manages college events, student registrations, clubs, venues, organizers, event schedules, and student feedback. Every page includes a real-time **Behind the Scenes** panel that displays the exact SQL query executed, the bound parameter array, and the raw JSON response received from the server.

### Technology Stack
- **Frontend:** Plain **HTML5, CSS3, and modern Vanilla JavaScript** (No React, Angular, Vue, Bootstrap, Tailwind, or build tools).
- **Backend:** **Node.js with Express**.
  - *Why Express?* Web browsers are sandboxed for security and cannot open raw TCP socket connections to a MySQL database directly. Express acts as a lightweight middleware API bridge to receive HTTP requests from `fetch()`, run parameterized SQL queries via `mysql2`, and return JSON data to the browser.
  - Express also serves the static frontend (`public` directory), eliminating the need for CORS.
- **Database:** **MySQL 8.x** with InnoDB storage engine.
- **Allowed Dependencies:** `express`, `mysql2`, `dotenv`.

---

## 2. Team Contribution Table

| Member | Part | Assigned Responsibilities & Owned Files |
|---|---|---|
| **Member 1** | **Part 1: Foundation + Student Module** | `database/schema.sql`, `database/sample_data.sql`, `server/server.js`, `server/db.js`, `server/package.json`, `server/.env.example`, `.gitignore`, `public/style.css`, `public/common.js`, `public/students.html`, `public/students.js`, `server/routes/students.js`, `docs/part1_explanation.md` |
| **Member 2** | **Part 2: Master Data Module** | `public/master.html`, `public/master.js`, `server/routes/master.js` (Venues, Organizers, Clubs, Categories), `docs/part2_explanation.md` |
| **Member 3** | **Part 3: Events + Schedule Module** | `public/events.html`, `public/events.js`, `public/schedule.html`, `public/schedule.js`, `server/routes/events.js`, `server/routes/schedule.js`, `docs/part3_explanation.md` |
| **Member 4** | **Part 4: Registrations + Feedback + Dashboard + Reports + Documentation** | `public/index.html`, `public/index.js`, `public/registrations.html`, `public/registrations.js`, `public/feedback.html`, `public/feedback.js`, `public/reports.html`, `public/reports.js`, `server/routes/registrations.js`, `server/routes/feedback.js`, `server/routes/dashboard.js`, `server/routes/reports.js`, `README.md`, `docs/part4_explanation.md`, `docs/demo_script.md` |

---

## 3. Project Directory Structure

```
event-management-system/
├── README.md                              # Main project documentation (Part 4)
├── MASTER_PROMPT.md                       # Assignment specifications & shared contracts
├── .gitignore                             # Git ignore rules (node_modules, .env) (Part 1)
├── database/
│   ├── schema.sql                         # Complete relational schema (11 tables) (Part 1)
│   └── sample_data.sql                    # Seed data with realistic college records (Part 1)
├── server/
│   ├── package.json                       # Node dependencies (express, mysql2, dotenv) (Part 1)
│   ├── .env.example                       # DB configuration template (Part 1)
│   ├── db.js                              # MySQL connection pool (Part 1)
│   ├── server.js                          # Express server setup and static file routing (Part 1)
│   └── routes/
│       ├── students.js                    # Student CRUD & phone multivalued routes (Part 1)
│       ├── master.js                      # Master data: venues, organizers, clubs, categories (Part 2)
│       ├── events.js                      # Events with derived status (Part 3)
│       ├── schedule.js                    # Weak entity schedule with composite key (Part 3)
│       ├── registrations.js               # Registration with capacity & unique check (Part 4)
│       ├── feedback.js                    # Feedback rating (1-5) and event filter (Part 4)
│       ├── dashboard.js                   # Metric counts and upcoming events (Part 4)
│       └── reports.js                     # 9 SQL reports with joins and aggregations (Part 4)
├── public/
│   ├── style.css                          # Shared plain CSS with print rules (Part 1)
│   ├── common.js                          # Shared helpers: navbar, callApi, buildTable (Part 1)
│   ├── index.html + index.js              # Dashboard view and logic (Part 4)
│   ├── students.html + students.js        # Students view and logic (Part 1)
│   ├── master.html + master.js            # Master data view and logic (Part 2)
│   ├── events.html + events.js            # Events view and logic (Part 3)
│   ├── schedule.html + schedule.js        # Schedule view and logic (Part 3)
│   ├── registrations.html + registrations.js # Registrations view and logic (Part 4)
│   ├── feedback.html + feedback.js        # Feedback view and logic (Part 4)
│   └── reports.html + reports.js          # Reports view with CSV & Print PDF (Part 4)
└── docs/
    ├── part1_explanation.md               # Viva preparation document for Part 1 (Part 1)
    ├── part2_explanation.md               # Viva preparation document for Part 2 (Part 2)
    ├── part3_explanation.md               # Viva preparation document for Part 3 (Part 3)
    ├── part4_explanation.md               # Viva preparation document for Part 4 (Part 4)
    └── demo_script.md                     # Step-by-step 7-step guide demonstration script (Part 4)
```

---

## 4. Setup and Installation Guide

### Step 1: Install MySQL and Node.js
Ensure you have **MySQL Server 8.x** and **Node.js** (v16 or higher) installed on your system.

### Step 2: Set Up the Database
Open your terminal or MySQL Workbench, connect to MySQL, and execute the SQL scripts in order:

```bash
# Log in to MySQL
mysql -u root -p

# Inside MySQL prompt (or execute in Workbench):
source database/schema.sql;
source database/sample_data.sql;
```

This creates the database `event_management` and sets up all 11 tables populated with initial sample data.

### Step 3: Configure Environment Variables
Inside the `server/` directory, create a `.env` file copied from `.env.example`:

```bash
cd server
cp .env.example .env
```

Open `.env` in any text editor and enter your local MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=event_management
PORT=3000
```

### Step 4: Install Dependencies & Start Server
Run the following commands inside the `server/` folder:

```bash
npm install
node server.js
```

You should see:
```
Server running on http://localhost:3000
Open http://localhost:3000/students.html to test the Student page.
```

### Step 5: Open in Your Browser
Open your browser and navigate to:
```
http://localhost:3000/index.html
```

---

## 5. Key DBMS Concepts Demonstrated

1. **Relational Constraints & Data Integrity:**
   - `PRIMARY KEY` (single-column auto-increment and composite keys).
   - `FOREIGN KEY` with default `RESTRICT` demonstrating referential integrity when attempting to delete referenced parent records.
   - `ON DELETE CASCADE` on weak entity `event_schedule`.
   - `UNIQUE (student_id, event_id)` constraint preventing duplicate registrations.
   - `CHECK (rating BETWEEN 1 AND 5)` constraint on ratings.
2. **Normalization & Multivalued Attributes:**
   - Multivalued phone numbers extracted into `student_phone` and `organizer_phone` tables to satisfy **1NF**.
3. **Derived Attributes:**
   - Event `status` is derived dynamically using `CASE` and `CURDATE()`.
4. **Parameterized Queries:**
   - Every SQL statement uses `?` placeholders to prevent **SQL Injection**.
5. **Analytical SQL Reports:**
   - `LEFT JOIN`, `INNER JOIN`, multi-table joins, `COUNT`, `AVG`, `GROUP BY`, `ORDER BY`, and `LIMIT`.
6. **Live Query Inspection:**
   - The **Behind the Scenes** container displays the exact SQL query, parameter values, and raw JSON response for every action.
