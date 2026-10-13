// routes/students.js
// Part 1: Built by Member 1
// Handles all API endpoints for the Student entity and student_phone table.

const express = require('express');
const router = express.Router();

// Import the database connection pool from db.js
const db = require('../db');

// ---------------------------------------------------------------
// Helper: convert MySQL error codes to friendly messages.
// This is called in every catch block so errors shown in the UI
// are readable by a normal user (not MySQL error codes).
// ---------------------------------------------------------------
function getFriendlyError(err) {
    if (err.code === 'ER_DUP_ENTRY')              return 'This record already exists.';
    if (err.code === 'ER_ROW_IS_REFERENCED_2')    return 'Cannot delete: other records depend on this one.';
    if (err.code === 'ER_NO_REFERENCED_ROW_2')    return 'Selected related record does not exist.';
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return 'Value is not allowed (check the rules).';
    // Default: use the raw MySQL message as fallback
    return err.message;
}

// ---------------------------------------------------------------
// GET /api/students
// Returns a list of all students ordered by student_id.
// SQL concept: simple SELECT with ORDER BY
// ---------------------------------------------------------------
router.get('/', async function (req, res) {
    // The SQL query we want to run
    const sql = 'SELECT * FROM student ORDER BY student_id';
    const params = [];  // no parameters needed for this query

    // async/await: 'await' pauses here until the database responds.
    // We wrap it in try/catch so that if the database has an error,
    // we send a friendly error response instead of crashing.
    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// GET /api/students/:id/phones
// Returns all phone numbers for a given student.
// This demonstrates the MULTIVALUED ATTRIBUTE concept from the ER diagram.
// SQL concept: SELECT with WHERE using a parameter
// ---------------------------------------------------------------
router.get('/:id/phones', async function (req, res) {
    // req.params.id comes from the URL, e.g. /api/students/3/phones
    const studentId = req.params.id;

    // Parameterized query: the '?' is replaced by studentId safely.
    // This PREVENTS SQL INJECTION because the value is never directly
    // inserted into the SQL string - mysql2 handles escaping automatically.
    const sql = 'SELECT * FROM student_phone WHERE student_id = ?';
    const params = [studentId];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// POST /api/students
// Inserts a new student and their phone numbers.
// The insert flow is:
//   1. INSERT into student table, get the new student_id (insertId).
//   2. For each phone number provided, INSERT into student_phone.
// SQL concepts: INSERT with parameterized values, AUTO_INCREMENT insertId
// ---------------------------------------------------------------
router.post('/', async function (req, res) {
    // Read values sent from the frontend form
    const studentName  = req.body.name;
    const studentEmail = req.body.email;
    const department   = req.body.department;
    const year         = req.body.year;
    const phone1       = req.body.phone1;
    const phone2       = req.body.phone2;  // optional, may be empty

    // SQL to insert the student record
    const sql = `
INSERT INTO student
    (name, email, department, year)
VALUES
    (?, ?, ?, ?)`;
    const params = [studentName, studentEmail, department, year];

    try {
        // Run the INSERT. The result object contains insertId - the new student_id.
        const [result] = await db.query(sql, params);
        const newStudentId = result.insertId;

        // Now insert phone 1 (always required)
        const phoneSql = 'INSERT INTO student_phone (student_id, phone) VALUES (?, ?)';
        if (phone1 && phone1.trim() !== '') {
            await db.query(phoneSql, [newStudentId, phone1.trim()]);
        }

        // Insert phone 2 only if the user provided it
        if (phone2 && phone2.trim() !== '') {
            await db.query(phoneSql, [newStudentId, phone2.trim()]);
        }

        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ student_id: newStudentId, message: 'Student added successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// PUT /api/students/:id
// Updates a student's name, email, department, and year.
// SQL concept: UPDATE with WHERE clause and parameterized values
// ---------------------------------------------------------------
router.put('/:id', async function (req, res) {
    const studentId    = req.params.id;
    const studentName  = req.body.name;
    const studentEmail = req.body.email;
    const department   = req.body.department;
    const year         = req.body.year;

    const sql = `
UPDATE student
SET
    name       = ?,
    email      = ?,
    department = ?,
    year       = ?
WHERE
    student_id = ?`;
    // Values must be in the same order as the '?' placeholders above
    const params = [studentName, studentEmail, department, year, studentId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Student updated successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// DELETE /api/students/:id
// Deletes a student by their student_id.
// IMPORTANT: If the student has registrations or feedback,
// MySQL will REFUSE the delete (RESTRICT foreign key default).
// We catch that error and show a friendly message - this is
// intentional to DEMONSTRATE referential integrity in the UI.
// SQL concept: DELETE with WHERE clause
// ---------------------------------------------------------------
router.delete('/:id', async function (req, res) {
    const studentId = req.params.id;

    const sql = 'DELETE FROM student WHERE student_id = ?';
    const params = [studentId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Student deleted successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

module.exports = router;
