# A#100005

Student Skill Progress Portal built with Next.js, React, TailwindCSS, Google OAuth, and MongoDB.

## Features

- Google sign-in restricted to an explicit allowlist of institutional email addresses
- Email-based role access for `member`, `admin`, and `super_admin`
- Spreadsheet-style skill tracking UI with sticky columns and horizontal scrolling
- MongoDB as the source of truth for students, skills, points, and role assignments
- Super Admin panel for granting and removing admin access

## Default role setup

These emails are treated as admins automatically:

- `vbalakumar.cs24@bitsathy.ac.in`
- `dhivyab.it24@bitsathy.ac.in`
- `shobikap.cs24@bitsathy.ac.in`
- `vasantharajm.cs24@bitsathy.ac.in`
- `thamaraimanalanr.cs24@bitsathy.ac.in`

Default Super Admin:

- `vasantharajm.cs24@bitsathy.ac.in`

## Allowed sign-ins

Only these email addresses can sign in:

- `vbalakumar.cs24@bitsathy.ac.in`
- `dhivyab.it24@bitsathy.ac.in`
- `shobikap.cs24@bitsathy.ac.in`
- `vasantharajm.cs24@bitsathy.ac.in`
- `surendharr.cs24@bitsathy.ac.in`
- `thamaraimanalanr.cs24@bitsathy.ac.in`
- `anishd.cs24@bitsathy.ac.in`
- `vijayprakasha.cs24@bitsathy.ac.in`
- `dharshinisr.it24@bitsathy.ac.in`
- `selvasobikam.cs24@bitsathy.ac.in`
- `poovarasank.cs25@bitsathy.ac.in`
- `ajaykrishnap.cs25@bitsathy.ac.in`
- `dineshkumark.ad25@bitsathy.ac.in`
- `maajithk.cs25@bitsathy.ac.in`
- `dulasidassvm.cs25@bitsathy.ac.in`

## MongoDB structure

The app uses three collections:

- `students`
- `roles`
- `settings`

`settings` stores the skill column list. `roles` stores extra admin and super admin assignments. Each `students` document should look like this:

```json
{
  "email": "student@bitsathy.ac.in",
  "values": {
    "Names": "Student Name",
    "Position": "Member",
    "Phone Number": "9876543210",
    "Special Lab Name": "AIML Lab",
    "Email": "student@bitsathy.ac.in",
    "Roll Number": "23CS001",
    "Google Sheet": "",
    "Reward Points": "10",
    "Activity Points": "4",
    "JavaScript": "Completed",
    "React": "",
    "Python": "Completed"
  }
}
```

All remaining keys inside `values` beyond the base fields are treated as spreadsheet skill columns.

## Environment setup

Copy `.env.example` to `.env.local` and configure:

- Google OAuth client credentials
- MongoDB Atlas connection string
- MongoDB database name
- Institutional email domain
- Allowed user email list

Important:

- Do not commit your real MongoDB URI or Google client secret.
- Because the MongoDB URI was pasted in chat, rotate that database password in MongoDB Atlas before using it in production.

## Run locally

```bash
npm install
npm run bootstrap
npm run dev
```

`npm run bootstrap` initializes MongoDB with:

- the spreadsheet skill columns
- placeholder student rows for every allowed email
- default admins
- the super admin role

## Deployment

Deploy to Vercel or Netlify with the same environment variables. Because filtering and updates happen on the server, members only receive the data they are allowed to see.
