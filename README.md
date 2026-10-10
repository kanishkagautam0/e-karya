# e-Karya — Admin/User Demo

## Included
- Landing page with separate Admin and User choices
- Admin login and employee-created login credentials
- Admin assigns tasks, priorities and deadlines
- Employees see only their assigned tasks
- Employees can update task status; Admin can monitor progress
- Local JSON file database (`server/data/db.json`)
- No face recognition, PostgreSQL or Prisma

## Run on Windows
Extract the ZIP. Open two VS Code terminals.

Terminal 1:
```powershell
cd server
npm install
npm start
```

Terminal 2:
```powershell
cd web
npm install
npm run dev
```
Open `http://localhost:5173`.

## Admin demo login
Email: `admin@ekarya.com`
Password: `admin123`

Admin creates employee accounts from the Admin Dashboard. Employees then choose USER on the landing page and sign in using the credentials Admin created.

## Prototype security note
This is a local college-demo prototype, not production-ready. Passwords are stored in plain text and the demo role headers are not secure authentication. Do not expose it publicly or use real employee data. For production, use password hashing, secure sessions, server-side authenticated identity, RBAC, HTTPS, validation, rate limiting, audit logs and PostgreSQL.
