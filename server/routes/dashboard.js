// routes/dashboard.js
// Part 4: Built by Member 4
// Handles API endpoint for the main Dashboard summary.
// Provides summary metric counts and upcoming events list.

const express = require('express');
const router = express.Router();

// Import the database connection pool from db.js
const db = require('../db');

// ---------------------------------------------------------------
// Helper: convert MySQL error codes to friendly messages.
// ---------------------------------------------------------------
function getFriendlyError(err) {
    return err.message;
}

// ---------------------------------------------------------------
// GET /api/dashboard
// Runs 4 simple count queries for students, events, registrations, and feedback,
// plus retrieves the next 5 upcoming events using CURDATE() and LIMIT.
// SQL concepts: COUNT aggregate function, CURDATE(), ORDER BY, LIMIT, INNER JOIN
// ---------------------------------------------------------------
router.get('/', async function (req, res) {
    try {
        // Query 1: Total students
        const studentSql = 'SELECT COUNT(*) AS total FROM student';
        const [studentRows] = await db.query(studentSql);
        const studentCount = studentRows[0].total;

        // Query 2: Total events
        const eventSql = 'SELECT COUNT(*) AS total FROM event';
        const [eventRows] = await db.query(eventSql);
        const eventCount = eventRows[0].total;

        // Query 3: Total registrations
        const regSql = 'SELECT COUNT(*) AS total FROM registration';
        const [regRows] = await db.query(regSql);
        const regCount = regRows[0].total;

        // Query 4: Total feedback entries
        const feedbackSql = 'SELECT COUNT(*) AS total FROM feedback';
        const [feedbackRows] = await db.query(feedbackSql);
        const feedbackCount = feedbackRows[0].total;

        // Query 5: Next 5 upcoming events
        const upcomingSql = `
SELECT
    event.event_id,
    event.event_name,
    event.event_date,
    event.start_time,
    venue.venue_name
FROM event
INNER JOIN venue ON event.venue_id = venue.venue_id
WHERE event.event_date >= CURDATE()
ORDER BY event.event_date ASC
LIMIT 5`;
        const [upcomingRows] = await db.query(upcomingSql);

        // Combined SQL description for the Behind the Scenes box
        const combinedSql = `${studentSql};\n${eventSql};\n${regSql};\n${feedbackSql};\n${upcomingSql.trim()}`;

        res.json({
            success: true,
            sql: combinedSql,
            params: [],
            data: {
                student_count:      studentCount,
                event_count:        eventCount,
                registration_count: regCount,
                feedback_count:     feedbackCount,
                upcoming_events:    upcomingRows
            }
        });

    } catch (err) {
        res.json({
            success: false,
            sql: 'SELECT COUNT(*) ...',
            params: [],
            message: getFriendlyError(err)
        });
    }
});

module.exports = router;
