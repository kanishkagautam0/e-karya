
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const dir = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(dir, "data", "db.json");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  try {
    // Import users first
    for (const u of data.users || []) {
      await pool.query(
        `INSERT INTO users
         (id, employee_id, name, email, password, role, department, designation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING`,
        [
          u.id,
          u.employeeId || null,
          u.name,
          u.email,
          u.password,
          u.role || "USER",
          u.department || "General",
          u.designation || "Employee",
        ]
      );
    }

    // Import tasks after users
    for (const t of data.tasks || []) {
      await pool.query(
        `INSERT INTO tasks
         (id, assigned_to, employee_id, employee_name,
          title, description, priority, deadline, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT DO NOTHING`,
        [
          t.id,
          t.userId,
          t.employeeId || null,
          t.employeeName || null,
          t.title,
          t.description || "",
          t.priority || "Medium",
          t.deadline || "",
          t.status || "Pending",
        ]
      );
    }

    console.log("JSON migration completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
