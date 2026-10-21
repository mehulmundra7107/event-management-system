// routes/registrations.js
// Part 4: Built by Member 4
// Handles all API endpoints for the Registration entity (student registers for event).
// Demonstrates M:N relationship, UNIQUE constraint, and venue capacity validation in Node.js.

const express = require('express');
const router = express.Router();

// Import the database connection pool from db.js
const db = require('../db');

// ---------------------------------------------------------------
// Helper: convert MySQL error codes to friendly messages.
// This is called in every catch block so errors shown in the UI
// are readable by a normal user (not raw database error codes).
// ---------------------------------------------------------------
function getFriendlyError(err) {
    if (err.code === 'ER_DUP_ENTRY')                 return 'This student is already registered for this event.';
    if (err.code === 'ER_ROW_IS_REFERENCED_2')       return 'Cannot delete: other records depend on this one.';
    if (err.code === 'ER_NO_REFERENCED_ROW_2')       return 'Selected related record does not exist.';
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return 'Value is not allowed (check the rules).';
    return err.message;
}

// ---------------------------------------------------------------
// GET /api/registrations
// Returns a list of all registrations joined with student and event.
// Shows: student name, event name, registration date, and status.
// SQL concept: multi-table INNER JOIN with ORDER BY
// ---------------------------------------------------------------
router.get('/', async function (req, res) {
    const sql = `
SELECT
    registration.registration_id,
    student.name AS student_name,
    event.event_name,
    registration.registration_date,
    registration.status
FROM registration
INNER JOIN student ON registration.student_id = student.student_id
INNER JOIN event ON registration.event_id = event.event_id
ORDER BY registration.registration_id DESC`;
    const params = [];

    // async/await pauses execution until the database query finishes.
    // Parameterized queries prevent SQL injection by separating SQL code from parameters.
    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// GET /api/registrations/events-list
// Helper endpoint to populate the Event dropdown on the registrations page.
// Allows Part 4 to function independently even before Part 3 is merged.
// SQL concept: simple SELECT with ORDER BY
// ---------------------------------------------------------------
router.get('/events-list', async function (req, res) {
    const sql = `
SELECT
    event.event_id,
    event.event_name
FROM event
ORDER BY event.event_name`;
    const params = [];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// POST /api/registrations
// Registers a student for an event after checking venue capacity in JavaScript.
// Step 1: Query venue capacity for the event.
// Step 2: Query total existing registrations for the event.
// Step 3: If total >= capacity, reject registration with "Event is full."
// Step 4: Otherwise, INSERT into registration. If UNIQUE constraint fails,
//         MySQL returns ER_DUP_ENTRY ("This student is already registered...").
// SQL concepts: INNER JOIN, COUNT, INSERT with foreign keys and UNIQUE constraint
// ---------------------------------------------------------------
router.post('/', async function (req, res) {
    const studentId        = req.body.student_id;
    const eventId          = req.body.event_id;
    const registrationDate = req.body.registration_date || new Date().toISOString().slice(0, 10);
    const status           = req.body.status || 'Registered';

    // Basic validation: student and event must be chosen
    if (!studentId || !eventId) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Please select both a student and an event.'
        });
    }

    try {
        // Step 1: Query venue capacity for this event
        const capacitySql = `
SELECT
    venue.capacity
FROM venue
INNER JOIN event ON event.venue_id = venue.venue_id
WHERE event.event_id = ?`;
        const capacityParams = [eventId];
        const [venueRows] = await db.query(capacitySql, capacityParams);

        if (venueRows.length === 0) {
            return res.json({
                success: false,
                sql: capacitySql,
                params: capacityParams,
                message: 'Selected event or its venue was not found.'
            });
        }

        const capacity = venueRows[0].capacity;

        // Step 2: Query total existing registrations for this event
        const countSql = `
SELECT
    COUNT(*) AS total
FROM registration
WHERE registration.event_id = ?`;
        const countParams = [eventId];
        const [countRows] = await db.query(countSql, countParams);
        const totalRegistered = countRows[0].total;

        // Step 3: Check capacity in plain JavaScript (no triggers)
        if (totalRegistered >= capacity) {
            return res.json({
                success: false,
                sql: countSql,
                params: countParams,
                message: 'Event is full.'
            });
        }

        // Step 4: Insert the registration
        const insertSql = `
INSERT INTO registration
    (student_id, event_id, registration_date, status)
VALUES
    (?, ?, ?, ?)`;
        const insertParams = [studentId, eventId, registrationDate, status];

        const [result] = await db.query(insertSql, insertParams);

        res.json({
            success: true,
            sql: insertSql,
            params: insertParams,
            data: [{ registration_id: result.insertId, message: 'Registration successful.' }]
        });

    } catch (err) {
        // If the student already registered for this event, MySQL throws ER_DUP_ENTRY
        // because of the UNIQUE (student_id, event_id) constraint in the schema.
        if (err.code === 'ER_DUP_ENTRY') {
            return res.json({
                success: false,
                sql: 'INSERT INTO registration (student_id, event_id, registration_date, status) VALUES (?, ?, ?, ?)',
                params: [studentId, eventId, registrationDate, status],
                message: 'This student is already registered for this event.'
            });
        }

        res.json({
            success: false,
            sql: '',
            params: [],
            message: getFriendlyError(err)
        });
    }
});

// ---------------------------------------------------------------
// DELETE /api/registrations/:id
// Deletes a registration record by its registration_id.
// SQL concept: DELETE with WHERE clause and parameterized parameter
// ---------------------------------------------------------------
router.delete('/:id', async function (req, res) {
    const registrationId = req.params.id;

    const sql = `
DELETE FROM registration
WHERE registration_id = ?`;
    const params = [registrationId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Registration deleted successfully.' }]
        });
    } catch (err) {
        res.json({
            success: false,
            sql: sql,
            params: params,
            message: getFriendlyError(err)
        });
    }
});

module.exports = router;
