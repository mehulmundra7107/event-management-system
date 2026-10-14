// routes/events.js
// Part 3: Built by Member 3 (Ragini)
// Handles all API endpoints for the Event entity (central entity in ER diagram).
// Includes multi-table joins, derived status calculation via CASE, and CRUD operations.

const express = require('express');
const router = express.Router();

// Import the database connection pool from db.js
const db = require('../db');

// ---------------------------------------------------------------
// Helper: convert MySQL error codes to friendly messages.
// This is called in every catch block so errors shown in the UI
// are readable by a normal user (not raw MySQL error codes).
// ---------------------------------------------------------------
function getFriendlyError(err) {
    if (err.code === 'ER_DUP_ENTRY')                 return 'This record already exists.';
    if (err.code === 'ER_ROW_IS_REFERENCED_2')       return 'Cannot delete: other records depend on this one.';
    if (err.code === 'ER_NO_REFERENCED_ROW_2')       return 'Selected related record does not exist.';
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return 'Value is not allowed (check the rules).';
    return err.message;
}

// ---------------------------------------------------------------
// GET /api/events
// Retrieves all events joined with venue, organizer, club, and category.
// Computes the derived Event Status using a CASE expression comparing
// the event_date with CURDATE().
// SQL concepts: INNER JOIN across 5 tables, CASE expression, ORDER BY
// ---------------------------------------------------------------
router.get('/', async function (req, res) {
    // Multi-table JOIN query with CASE expression for derived status.
    // Notice: status is NOT a stored column in the database; it is derived dynamically.
    const sql = `
SELECT
    event.event_id,
    event.event_name,
    event.description,
    event.event_date,
    event.event_type,
    event.start_time,
    event.end_time,
    event.club_id,
    event.organizer_id,
    event.venue_id,
    event.category_id,
    venue.venue_name,
    organizer.name AS organizer_name,
    club.club_name,
    event_category.category_name,
    CASE
        WHEN event.event_date < CURDATE() THEN 'Completed'
        WHEN event.event_date = CURDATE() THEN 'Ongoing'
        ELSE 'Upcoming'
    END AS status
FROM event
INNER JOIN venue ON event.venue_id = venue.venue_id
INNER JOIN organizer ON event.organizer_id = organizer.organizer_id
INNER JOIN club ON event.club_id = club.club_id
INNER JOIN event_category ON event.category_id = event_category.category_id
ORDER BY event.event_date`;
    const params = [];

    // async/await: pauses execution until the database query resolves
    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// POST /api/events
// Inserts a new event into the event table.
// SQL concept: Parameterized INSERT with multiple foreign keys
// ---------------------------------------------------------------
router.post('/', async function (req, res) {
    // Read input values sent from the frontend form
    const eventName    = req.body.event_name;
    const description  = req.body.description || '';
    const eventDate    = req.body.event_date;
    const eventType    = req.body.event_type || '';
    const startTime    = req.body.start_time || null;
    const endTime      = req.body.end_time || null;
    const clubId       = req.body.club_id;
    const organizerId  = req.body.organizer_id;
    const venueId      = req.body.venue_id;
    const categoryId   = req.body.category_id;

    // Validate required fields
    if (!eventName || !eventDate || !clubId || !organizerId || !venueId || !categoryId) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Please fill in all required fields (Name, Date, Club, Organizer, Venue, Category).'
        });
    }

    // Parameterized INSERT query: '?' placeholders prevent SQL injection
    const sql = `
INSERT INTO event
    (event_name, description, event_date, event_type, start_time, end_time, club_id, organizer_id, venue_id, category_id)
VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        eventName,
        description,
        eventDate,
        eventType,
        startTime,
        endTime,
        clubId,
        organizerId,
        venueId,
        categoryId
    ];

    try {
        const [result] = await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ event_id: result.insertId, message: 'Event added successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// PUT /api/events/:id
// Updates an existing event's details.
// SQL concept: Parameterized UPDATE with WHERE clause
// ---------------------------------------------------------------
router.put('/:id', async function (req, res) {
    const eventId      = req.params.id;
    const eventName    = req.body.event_name;
    const description  = req.body.description || '';
    const eventDate    = req.body.event_date;
    const eventType    = req.body.event_type || '';
    const startTime    = req.body.start_time || null;
    const endTime      = req.body.end_time || null;
    const clubId       = req.body.club_id;
    const organizerId  = req.body.organizer_id;
    const venueId      = req.body.venue_id;
    const categoryId   = req.body.category_id;

    if (!eventName || !eventDate || !clubId || !organizerId || !venueId || !categoryId) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Please fill in all required fields.'
        });
    }

    const sql = `
UPDATE event
SET
    event_name   = ?,
    description  = ?,
    event_date   = ?,
    event_type   = ?,
    start_time   = ?,
    end_time     = ?,
    club_id      = ?,
    organizer_id = ?,
    venue_id     = ?,
    category_id  = ?
WHERE
    event_id = ?`;
    const params = [
        eventName,
        description,
        eventDate,
        eventType,
        startTime,
        endTime,
        clubId,
        organizerId,
        venueId,
        categoryId,
        eventId
    ];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Event updated successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// DELETE /api/events/:id
// Deletes an event by its event_id.
// IMPORTANT NOTES:
// 1. If registrations or feedback exist for this event, MySQL blocks
//    the deletion (RESTRICT default). We show a friendly error to demonstrate
//    referential integrity.
// 2. Schedule rows in event_schedule are deleted automatically by MySQL
//    because of ON DELETE CASCADE.
// SQL concept: Parameterized DELETE with WHERE clause
// ---------------------------------------------------------------
router.delete('/:id', async function (req, res) {
    const eventId = req.params.id;

    const sql = `
DELETE FROM event
WHERE event_id = ?`;
    const params = [eventId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Event deleted successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

module.exports = router;
