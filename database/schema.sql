-- ============================================================
-- schema.sql
-- Event Management System - Database Schema
-- Run this file first before sample_data.sql
-- ============================================================

-- Create and select the database
CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

-- ============================================================
-- ER Entity: Student
-- Stores college student information
-- ============================================================
CREATE TABLE IF NOT EXISTS student (
    student_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    department  VARCHAR(100) NOT NULL,
    year        INT NOT NULL
);

-- ============================================================
-- Multivalued Attribute of Student: phone
-- A student can have more than one phone number,
-- so we store them in a separate table (one row per phone)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_phone (
    phone_id    INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    phone       VARCHAR(20) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES student(student_id)
);

-- ============================================================
-- ER Entity: Club / Committee
-- A club that sponsors events
-- ============================================================
CREATE TABLE IF NOT EXISTS club (
    club_id       INT AUTO_INCREMENT PRIMARY KEY,
    club_name     VARCHAR(150) NOT NULL,
    description   TEXT,
    contact_email VARCHAR(150)
);

-- ============================================================
-- ER Entity: Organizer
-- The person or group that organizes an event
-- ============================================================
CREATE TABLE IF NOT EXISTS organizer (
    organizer_id    INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    department_club VARCHAR(150)
);

-- ============================================================
-- Multivalued Attribute of Organizer: phone
-- Same reason as student_phone - an organizer can have
-- more than one contact number
-- ============================================================
CREATE TABLE IF NOT EXISTS organizer_phone (
    phone_id     INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    phone        VARCHAR(20) NOT NULL,
    FOREIGN KEY (organizer_id) REFERENCES organizer(organizer_id)
);

-- ============================================================
-- ER Entity: Venue
-- The physical place where an event is held
-- ============================================================
CREATE TABLE IF NOT EXISTS venue (
    venue_id    INT AUTO_INCREMENT PRIMARY KEY,
    venue_name  VARCHAR(150) NOT NULL,
    location    VARCHAR(255),
    capacity    INT NOT NULL
);

-- ============================================================
-- ER Entity: Event_Category
-- Type/category of event (Technical, Cultural, Sports, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_category (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description   TEXT
);

-- ============================================================
-- ER Entity: Event
-- Central entity. Linked to venue, organizer, club, category.
-- NOTE: status is NOT stored here - it is a derived attribute
--       computed in SELECT using the event_date and CURDATE().
-- event_date is used instead of 'date' because 'date' is a
-- reserved word in MySQL.
-- ============================================================
CREATE TABLE IF NOT EXISTS event (
    event_id      INT AUTO_INCREMENT PRIMARY KEY,
    event_name    VARCHAR(200) NOT NULL,
    description   TEXT,
    event_date    DATE NOT NULL,
    event_type    VARCHAR(100),
    start_time    TIME,
    end_time      TIME,
    club_id       INT NOT NULL,
    organizer_id  INT NOT NULL,
    venue_id      INT NOT NULL,
    category_id   INT NOT NULL,
    FOREIGN KEY (club_id)      REFERENCES club(club_id),
    FOREIGN KEY (organizer_id) REFERENCES organizer(organizer_id),
    FOREIGN KEY (venue_id)     REFERENCES venue(venue_id),
    FOREIGN KEY (category_id)  REFERENCES event_category(category_id)
);

-- ============================================================
-- ER Weak Entity: Event_Schedule
-- Stores individual activities/sessions within an event.
-- This is a WEAK entity: schedule_id alone is not unique;
-- it is only unique within one event.
-- So the PRIMARY KEY is a COMPOSITE KEY: (event_id, schedule_id).
-- ON DELETE CASCADE means: if the parent event is deleted,
-- all its schedule rows are deleted automatically.
-- ============================================================
CREATE TABLE IF NOT EXISTS event_schedule (
    event_id      INT NOT NULL,
    schedule_id   INT NOT NULL,
    activity_name VARCHAR(200) NOT NULL,
    start_time    TIME,
    end_time      TIME,
    PRIMARY KEY (event_id, schedule_id),
    FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE
);

-- ============================================================
-- ER Relationship: Registration (Student registers for Event)
-- M:N relationship resolved into its own table.
-- UNIQUE (student_id, event_id) ensures a student cannot
-- register for the same event twice (enforces the constraint).
-- Foreign keys use default RESTRICT: deleting a student or
-- event that has registrations will fail (we show this in UI).
-- ============================================================
CREATE TABLE IF NOT EXISTS registration (
    registration_id   INT AUTO_INCREMENT PRIMARY KEY,
    student_id        INT NOT NULL,
    event_id          INT NOT NULL,
    registration_date DATE NOT NULL,
    status            VARCHAR(50) DEFAULT 'Registered',
    UNIQUE (student_id, event_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (event_id)   REFERENCES event(event_id)
);

-- ============================================================
-- ER Relationship: Feedback (Student evaluates Event)
-- M:N relationship resolved into its own table.
-- CHECK constraint ensures rating is between 1 and 5.
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id   INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT NOT NULL,
    event_id      INT NOT NULL,
    rating        INT NOT NULL,
    comments      TEXT,
    feedback_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (event_id)   REFERENCES event(event_id),
    CHECK (rating BETWEEN 1 AND 5)
);
