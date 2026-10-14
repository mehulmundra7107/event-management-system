// routes/schedule.js
// Part 3: Built by Member 3 (Ragini)
// Handles API routes for Event Schedule (weak entity in the ER diagram).
// Event_Schedule has a partial key (schedule_id) and a composite primary key (event_id, schedule_id).

const express = require('express');
const router = express.Router();

// Import database connection pool from db.js
const db = require('../db');

// ---------------------------------------------------------------
// Helper: convert MySQL error codes to friendly messages.
// ---------------------------------------------------------------
function getFriendlyError(err) {
    if (err.code === 'ER_DUP_ENTRY')                 return 'This schedule entry already exists.';
    if (err.code === 'ER_ROW_IS_REFERENCED_2')       return 'Cannot delete: other records depend on this schedule entry.';
    if (err.code === 'ER_NO_REFERENCED_ROW_2')       return 'Parent event does not exist.';
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') return 'Value is not allowed (check the rules).';
    return err.message;
}

// ---------------------------------------------------------------
// GET /api/schedule/:eventId
// Retrieves all schedule activities for a specific event.
// SQL concept: Parameterized SELECT with WHERE clause and ORDER BY
// ---------------------------------------------------------------
router.get('/:eventId', async function (req, res) {
    const eventId = req.params.eventId;

    const sql = `
SELECT
    event_id,
    schedule_id,
    activity_name,
    start_time,
    end_time
FROM event_schedule
WHERE event_id = ?
ORDER BY schedule_id`;
    const params = [eventId];

    try {
        const [rows] = await db.query(sql, params);
        res.json({ success: true, sql: sql, params: params, data: rows });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// POST /api/schedule/:eventId
// Adds a new activity to an event's schedule.
//
// WEAK ENTITY & PARTIAL KEY EXPLANATION:
// In our ER diagram, Event_Schedule is a WEAK ENTITY that cannot exist
// without its identifying parent entity (Event).
// schedule_id is only a PARTIAL KEY (discriminator) — it is NOT globally unique;
// it is only unique within the scope of one event (e.g. Activity 1, 2, 3 for Event 1;
// Activity 1, 2 for Event 2).
// The full PRIMARY KEY is the composite key (event_id, schedule_id).
//
// Here, we compute the next schedule_id for this event by running:
//   SELECT MAX(schedule_id) AS lastId FROM event_schedule WHERE event_id = ?
// If no activities exist yet, lastId is null and we start at 1.
// Otherwise, next schedule_id is lastId + 1.
// ---------------------------------------------------------------
router.post('/:eventId', async function (req, res) {
    const eventId      = req.params.eventId;
    const activityName = req.body.activity_name;
    const startTime    = req.body.start_time || null;
    const endTime      = req.body.end_time || null;

    if (!activityName || activityName.trim() === '') {
        return res.json({
            success: false,
            sql: '',
            params: [],
            message: 'Please provide an activity name.'
        });
    }

    try {
        // Step 1: Query for the highest existing schedule_id for this specific event
        const maxSql = `
SELECT MAX(schedule_id) AS lastId
FROM event_schedule
WHERE event_id = ?`;
        const [maxRows] = await db.query(maxSql, [eventId]);

        // If no rows exist for this event yet, start with 1; otherwise increment lastId
        const lastId = maxRows[0].lastId;
        const nextScheduleId = (lastId !== null && lastId !== undefined) ? (lastId + 1) : 1;

        // Step 2: Insert the new schedule activity using the composite primary key
        const insertSql = `
INSERT INTO event_schedule
    (event_id, schedule_id, activity_name, start_time, end_time)
VALUES
    (?, ?, ?, ?, ?)`;
        const insertParams = [eventId, nextScheduleId, activityName.trim(), startTime, endTime];

        await db.query(insertSql, insertParams);

        res.json({
            success: true,
            sql: insertSql,
            params: insertParams,
            data: [{
                event_id: Number(eventId),
                schedule_id: nextScheduleId,
                message: 'Activity added to schedule.'
            }]
        });
    } catch (err) {
        res.json({ success: false, sql: '', params: [], message: getFriendlyError(err) });
    }
});

// ---------------------------------------------------------------
// DELETE /api/schedule/:eventId/:scheduleId
// Deletes a single activity from an event's schedule.
// Uses BOTH keys of the composite primary key (event_id, schedule_id)
// to uniquely identify the row to delete.
// SQL concept: Parameterized DELETE with compound WHERE conditions
// ---------------------------------------------------------------
router.delete('/:eventId/:scheduleId', async function (req, res) {
    const eventId    = req.params.eventId;
    const scheduleId = req.params.scheduleId;

    const sql = `
DELETE FROM event_schedule
WHERE event_id = ? AND schedule_id = ?`;
    const params = [eventId, scheduleId];

    try {
        await db.query(sql, params);
        res.json({
            success: true,
            sql: sql,
            params: params,
            data: [{ message: 'Schedule activity deleted successfully.' }]
        });
    } catch (err) {
        res.json({ success: false, sql: sql, params: params, message: getFriendlyError(err) });
    }
});

module.exports = router;
