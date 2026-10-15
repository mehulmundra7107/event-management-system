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
// Resolvers: ensure that selected Master Data names or IDs map
// to existing foreign key IDs in venue, organizer, club, and event_category.
// This guarantees referential integrity without foreign key violations.
// ---------------------------------------------------------------
async function resolveVenueId(venueValue) {
    if (!venueValue) return null;
    if (!isNaN(venueValue) && Number(venueValue) > 0) {
        const [rows] = await db.query('SELECT venue_id FROM venue WHERE venue_id = ?', [Number(venueValue)]);
        if (rows.length > 0) return rows[0].venue_id;
    }
    const cleanName = String(venueValue).trim();
    const [existing] = await db.query('SELECT venue_id FROM venue WHERE venue_name = ?', [cleanName]);
    if (existing.length > 0) return existing[0].venue_id;

    // Insert if not already present in venue table
    const [inserted] = await db.query(
        'INSERT INTO venue (venue_name, location, capacity) VALUES (?, ?, ?)',
        [cleanName, 'COEP Campus', 300]
    );
    return inserted.insertId;
}

async function resolveOrganizerId(organizerValue) {
    if (!organizerValue) return null;
    if (!isNaN(organizerValue) && Number(organizerValue) > 0) {
        const [rows] = await db.query('SELECT organizer_id FROM organizer WHERE organizer_id = ?', [Number(organizerValue)]);
        if (rows.length > 0) return rows[0].organizer_id;
    }
    const cleanName = String(organizerValue).trim();
    const [existing] = await db.query('SELECT organizer_id FROM organizer WHERE name = ?', [cleanName]);
    if (existing.length > 0) return existing[0].organizer_id;

    const emailPrefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueEmail = `${emailPrefix}_${Date.now()}@coep.ac.in`;
    const [inserted] = await db.query(
        'INSERT INTO organizer (name, email, department_club) VALUES (?, ?, ?)',
        [cleanName, uniqueEmail, 'COEP']
    );
    return inserted.insertId;
}

async function resolveClubId(clubValue) {
    if (!clubValue) return null;
    if (!isNaN(clubValue) && Number(clubValue) > 0) {
        const [rows] = await db.query('SELECT club_id FROM club WHERE club_id = ?', [Number(clubValue)]);
        if (rows.length > 0) return rows[0].club_id;
    }
    const cleanName = String(clubValue).trim();
    const [existing] = await db.query('SELECT club_id FROM club WHERE club_name = ?', [cleanName]);
    if (existing.length > 0) return existing[0].club_id;

    const emailPrefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueEmail = `${emailPrefix}_${Date.now()}@coep.ac.in`;
    const [inserted] = await db.query(
        'INSERT INTO club (club_name, description, contact_email) VALUES (?, ?, ?)',
        [cleanName, 'COEP Student Club / Committee', uniqueEmail]
    );
    return inserted.insertId;
}

async function resolveCategoryId(categoryValue) {
    if (!categoryValue) return null;
    if (!isNaN(categoryValue) && Number(categoryValue) > 0) {
        const [rows] = await db.query('SELECT category_id FROM event_category WHERE category_id = ?', [Number(categoryValue)]);
        if (rows.length > 0) return rows[0].category_id;
    }
    const cleanName = String(categoryValue).trim();
    const [existing] = await db.query('SELECT category_id FROM event_category WHERE category_name = ?', [cleanName]);
    if (existing.length > 0) return existing[0].category_id;

    const [inserted] = await db.query(
        'INSERT INTO event_category (category_name, description) VALUES (?, ?)',
        [cleanName, 'COEP Event Category']
    );
    return inserted.insertId;
}

// ---------------------------------------------------------------
// GET /api/events
// Retrieves all events joined with venue, organizer, club, and category.
// Computes the derived Event Status using a CASE expression comparing
// the event_date with CURDATE().
// SQL concepts: INNER JOIN across 5 tables, CASE expression, ORDER BY
// ---------------------------------------------------------------
router.get('/', async function (req, res) {
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
    const eventName    = req.body.event_name;
    const description  = req.body.description || '';
    const eventDate    = req.body.event_date;
    const eventType    = req.body.event_type || '';
    const startTime    = req.body.start_time || null;
    const endTime      = req.body.end_time || null;
    const rawClub      = req.body.club_id || req.body.club_name;
    const rawOrganizer = req.body.organizer_id || req.body.organizer_name;
    const rawVenue     = req.body.venue_id || req.body.venue_name;
    const rawCategory  = req.body.category_id || req.body.category_name;

    if (!eventName || !eventDate || !rawClub || !rawOrganizer || !rawVenue || !rawCategory) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Please fill in all required fields (Name, Date, Club, Organizer, Venue, Category).'
        });
    }

    try {
        // Resolve master values into valid foreign key IDs
        const venueId     = await resolveVenueId(rawVenue);
        const organizerId = await resolveOrganizerId(rawOrganizer);
        const clubId      = await resolveClubId(rawClub);
        const categoryId  = await resolveCategoryId(rawCategory);

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

        const [result] = await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ event_id: result.insertId, message: 'Event added successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: '', params: [], message: getFriendlyError(err) });
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
    const rawClub      = req.body.club_id || req.body.club_name;
    const rawOrganizer = req.body.organizer_id || req.body.organizer_name;
    const rawVenue     = req.body.venue_id || req.body.venue_name;
    const rawCategory  = req.body.category_id || req.body.category_name;

    if (!eventName || !eventDate || !rawClub || !rawOrganizer || !rawVenue || !rawCategory) {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Please fill in all required fields.'
        });
    }

    try {
        const venueId     = await resolveVenueId(rawVenue);
        const organizerId = await resolveOrganizerId(rawOrganizer);
        const clubId      = await resolveClubId(rawClub);
        const categoryId  = await resolveCategoryId(rawCategory);

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

        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Event updated successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: '', params: [], message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// DELETE /api/events/:id
// Deletes an event by its event_id.
// Referential actions:
// - RESTRICT: blocks deletion if registration/feedback exist
// - CASCADE: automatically deletes related event_schedule rows
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
