-- ==========================================
-- e-Karya Database Schema
-- ==========================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users / Employees
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE',
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    employee_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN ('ADMIN', 'EMPLOYEE', 'MANAGER'))
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department_id INTEGER NOT NULL
        REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT teams_department_name_unique
        UNIQUE (department_id, name)
);

-- ==========================================
-- Attendance
-- ==========================================

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    attendance_date DATE NOT NULL,

    check_in TIMESTAMP NULL,
    check_out TIMESTAMP NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',

    remarks TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT attendance_status_check
        CHECK (
            status IN (
                'PRESENT',
                'ABSENT',
                'HALF_DAY',
                'LEAVE',
                'HOLIDAY'
            )
        ),

    CONSTRAINT unique_user_attendance_date
        UNIQUE (user_id, attendance_date)
);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_attendance_user_id
    ON attendance(user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date
    ON attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date
    ON attendance(user_id, attendance_date);