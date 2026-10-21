// routes/reports.js
// Part 4: Built by Member 4
// Handles all reporting API endpoints for the Event Management System.
// Uses simple if/else if chain with beginner-friendly SQL queries.

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
// GET /api/reports/:reportName
// Runs one of the 9 predefined SQL reports based on the reportName parameter.
// Uses a simple if / else if chain (no complex lookup objects).
// ---------------------------------------------------------------
router.get('/:reportName', async function (req, res) {
    const reportName = req.params.reportName;
    let sql = '';
    let params = [];

    // -----------------------------------------------------------
    // Report 1: registrations-per-event
    // Counts how many students registered for each event.
    // SQL concepts: LEFT JOIN (includes events with 0 registrations), COUNT, GROUP BY
    // -----------------------------------------------------------
    if (reportName === 'registrations-per-event') {
        sql = `
SELECT
    event.event_id,
    event.event_name,
    COUNT(registration.registration_id) AS total_registrations
FROM event
LEFT JOIN registration ON event.event_id = registration.event_id
GROUP BY
    event.event_id,
    event.event_name
ORDER BY total_registrations DESC`;

    // -----------------------------------------------------------
    // Report 2: average-rating-per-event
    // Calculates the average feedback rating for each rated event.
    // SQL concepts: INNER JOIN, AVG aggregate function, COUNT, GROUP BY
    // -----------------------------------------------------------
    } else if (reportName === 'average-rating-per-event') {
        sql = `
SELECT
    event.event_id,
    event.event_name,
    AVG(feedback.rating) AS average_rating,
    COUNT(feedback.feedback_id) AS total_reviews
FROM event
INNER JOIN feedback ON event.event_id = feedback.event_id
GROUP BY
    event.event_id,
    event.event_name
ORDER BY average_rating DESC`;

    // -----------------------------------------------------------
    // Report 3: top-rated-events
    // Finds the top 3 highest-rated events.
    // SQL concepts: INNER JOIN, AVG, GROUP BY, ORDER BY DESC, LIMIT 3
    // -----------------------------------------------------------
    } else if (reportName === 'top-rated-events') {
        sql = `
SELECT
    event.event_id,
    event.event_name,
    AVG(feedback.rating) AS average_rating,
    COUNT(feedback.feedback_id) AS total_reviews
FROM event
INNER JOIN feedback ON event.event_id = feedback.event_id
GROUP BY
    event.event_id,
    event.event_name
ORDER BY average_rating DESC
LIMIT 3`;

    // -----------------------------------------------------------
    // Report 4: events-per-club
    // Counts how many events each club has sponsored.
    // SQL concepts: LEFT JOIN (shows clubs even with 0 events), COUNT, GROUP BY
    // -----------------------------------------------------------
    } else if (reportName === 'events-per-club') {
        sql = `
SELECT
    club.club_id,
    club.club_name,
    COUNT(event.event_id) AS total_events
FROM club
LEFT JOIN event ON club.club_id = event.club_id
GROUP BY
    club.club_id,
    club.club_name
ORDER BY total_events DESC`;

    // -----------------------------------------------------------
    // Report 5: events-per-category
    // Counts how many events belong to each event category.
    // SQL concepts: LEFT JOIN, COUNT, GROUP BY
    // -----------------------------------------------------------
    } else if (reportName === 'events-per-category') {
        sql = `
SELECT
    event_category.category_id,
    event_category.category_name,
    COUNT(event.event_id) AS total_events
FROM event_category
LEFT JOIN event ON event_category.category_id = event.category_id
GROUP BY
    event_category.category_id,
    event_category.category_name
ORDER BY total_events DESC`;

    // -----------------------------------------------------------
    // Report 6: venue-usage
    // Displays each event with its venue seating capacity and current registered student count.
    // SQL concepts: 3-table JOIN (INNER JOIN and LEFT JOIN), COUNT, GROUP BY
    // -----------------------------------------------------------
    } else if (reportName === 'venue-usage') {
        sql = `
SELECT
    event.event_id,
    event.event_name,
    venue.venue_name,
    venue.capacity,
    COUNT(registration.registration_id) AS registered_students
FROM event
INNER JOIN venue ON event.venue_id = venue.venue_id
LEFT JOIN registration ON event.event_id = registration.event_id
GROUP BY
    event.event_id,
    event.event_name,
    venue.venue_name,
    venue.capacity
ORDER BY event.event_id`;

    // -----------------------------------------------------------
    // Report 7: upcoming-events
    // Lists all future and ongoing events with venue, organizer, and club details.
    // SQL concepts: 4-table INNER JOIN, WHERE with CURDATE() date comparison
    // -----------------------------------------------------------
    } else if (reportName === 'upcoming-events') {
        sql = `
SELECT
    event.event_id,
    event.event_name,
    event.event_date,
    event.start_time,
    venue.venue_name,
    organizer.name AS organizer_name,
    club.club_name
FROM event
INNER JOIN venue ON event.venue_id = venue.venue_id
INNER JOIN organizer ON event.organizer_id = organizer.organizer_id
INNER JOIN club ON event.club_id = club.club_id
WHERE event.event_date >= CURDATE()
ORDER BY event.event_date ASC`;

    // -----------------------------------------------------------
    // Report 8: events-with-no-registrations
    // Finds events that have zero student registrations.
    // SQL concepts: LEFT JOIN with WHERE IS NULL (identifies unmatched rows)
    // -----------------------------------------------------------
    } else if (reportName === 'events-with-no-registrations') {
        sql = `
SELECT
    event.event_id,
    event.event_name,
    event.event_date,
    club.club_name
FROM event
INNER JOIN club ON event.club_id = club.club_id
LEFT JOIN registration ON event.event_id = registration.event_id
WHERE registration.registration_id IS NULL
ORDER BY event.event_date`;

    // -----------------------------------------------------------
    // Report 9: student-history
    // Lists all events that a specific student has registered for.
    // Student ID is passed via query string (?studentId=X).
    // SQL concepts: 3-table INNER JOIN, parameterized WHERE clause
    // -----------------------------------------------------------
    } else if (reportName === 'student-history') {
        const studentId = req.query.studentId;

        if (!studentId) {
            return res.json({
                success: false,
                sql: '',
                params: [],
                message: 'Please provide a studentId query parameter.'
            });
        }

        sql = `
SELECT
    student.name AS student_name,
    event.event_name,
    event.event_date,
    registration.registration_date,
    registration.status
FROM registration
INNER JOIN student ON registration.student_id = student.student_id
INNER JOIN event ON registration.event_id = event.event_id
WHERE registration.student_id = ?
ORDER BY registration.registration_date DESC`;
        params = [studentId];

    // If report name is not recognized
    } else {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Unknown report: ' + reportName
        });
    }

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

module.exports = router;
