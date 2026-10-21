// routes/feedback.js
// Part 4: Built by Member 4
// Handles all API endpoints for the Feedback entity (student evaluates event).
// Demonstrates M:N relationship, CHECK constraint (rating 1-5), and event-based filtering.

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
    if (err.code === 'ER_DUP_ENTRY')                 return 'This record already exists.';
    if (err.code === 'ER_ROW_IS_REFERENCED_2')       return 'Cannot delete: other records depend on this one.';
    if (err.code === 'ER_NO_REFERENCED_ROW_2')       return 'Selected related record does not exist.';
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return 'Value is not allowed (rating must be between 1 and 5).';
    return err.message;
}

// ---------------------------------------------------------------
// GET /api/feedback
// Returns all feedback records joined with student and event.
// Shows: student name, event name, rating, comments, feedback date.
// SQL concept: multi-table INNER JOIN with ORDER BY
// ---------------------------------------------------------------
router.get('/', async function (req, res) {
    const sql = `
SELECT
    feedback.feedback_id,
    student.name AS student_name,
    event.event_name,
    feedback.rating,
    feedback.comments,
    feedback.feedback_date
FROM feedback
INNER JOIN student ON feedback.student_id = student.student_id
INNER JOIN event ON feedback.event_id = event.event_id
ORDER BY feedback.feedback_id DESC`;
    const params = [];

    // Parameterized queries prevent SQL injection by keeping values separate from SQL commands.
    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// GET /api/feedback/events-list
// Helper endpoint to populate Event dropdowns on the feedback page.
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
// GET /api/feedback/event/:eventId
// Returns all feedback records for a specific event.
// Used by the frontend filter dropdown.
// SQL concept: multi-table INNER JOIN with WHERE parameter
// ---------------------------------------------------------------
router.get('/event/:eventId', async function (req, res) {
    const eventId = req.params.eventId;

    const sql = `
SELECT
    feedback.feedback_id,
    student.name AS student_name,
    event.event_name,
    feedback.rating,
    feedback.comments,
    feedback.feedback_date
FROM feedback
INNER JOIN student ON feedback.student_id = student.student_id
INNER JOIN event ON feedback.event_id = event.event_id
WHERE feedback.event_id = ?
ORDER BY feedback.feedback_id DESC`;
    const params = [eventId];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// POST /api/feedback
// Inserts a new feedback row submitted by a student for an event.
// Rating is validated in JavaScript (1 to 5) and by MySQL's CHECK constraint.
// SQL concept: parameterized INSERT with foreign keys and CHECK constraint
// ---------------------------------------------------------------
router.post('/', async function (req, res) {
    const studentId    = req.body.student_id;
    const eventId      = req.body.event_id;
    const rating       = parseInt(req.body.rating, 10);
    const comments     = req.body.comments || '';
    const feedbackDate = req.body.feedback_date || new Date().toISOString().slice(0, 10);

    // Validation: student and event required
    if (!studentId || !eventId) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Please select both a student and an event.'
        });
    }

    // JavaScript validation for rating (1 to 5)
    if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Rating must be an integer between 1 and 5.'
        });
    }

    const sql = `
INSERT INTO feedback
    (student_id, event_id, rating, comments, feedback_date)
VALUES
    (?, ?, ?, ?, ?)`;
    const params = [studentId, eventId, rating, comments, feedbackDate];

    try {
        const [result] = await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ feedback_id: result.insertId, message: 'Feedback submitted successfully.' }]
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
