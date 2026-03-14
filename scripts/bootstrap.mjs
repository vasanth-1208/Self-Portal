import { MongoClient } from "mongodb";

const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const BASIC_FIELDS = [
  "Names",
  "Position",
  "Phone Number",
  "Special Lab Name",
  "Email",
  "Roll Number",
  "Google Sheet",
  "Reward Points",
  "Activity Points"
];

const SKILL_FIELDS = [
  "Version Control - Git / Github",
  "Data Structure - Core Concepts",
  "DBMS - Core Concepts",
  "JavaScript",
  "Aptitude",
  "Communication",
  "IPR",
  "Android Development",
  "Physical Fitness",
  "General Engineering",
  "TRIZ",
  "Algebra",
  "Logical Reasoning",
  "System Administration",
  "UI/UX",
  "C Programming",
  "C++",
  "Python",
  "Java",
  "Database Programming",
  "Computer Networking",
  "Linux",
  "Calculus",
  "HTML/CSS",
  "React",
  "Yoga",
  "Group Discussion",
  "Differential Equations"
];

const toDisplayName = (email) =>
  email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeEmailList = (value) =>
  value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const allowedEmails = normalizeEmailList(required("ALLOWED_USER_EMAILS"));
const adminEmails = new Set(normalizeEmailList(process.env.DEFAULT_ADMIN_EMAILS || ""));
const superAdminEmail = required("SUPER_ADMIN_EMAIL").trim().toLowerCase();

const mongodbUri = required("MONGODB_URI");
const dbName = process.env.MONGODB_DB_NAME || "a100005";

const client = new MongoClient(mongodbUri);

const buildStudentValues = (email) => {
  const values = {
    Names: toDisplayName(email),
    Position: adminEmails.has(email) || email === superAdminEmail ? "Admin" : "Member",
    "Phone Number": "",
    "Special Lab Name": "",
    Email: email,
    "Roll Number": "",
    "Google Sheet": "",
    "Reward Points": "0",
    "Activity Points": "0"
  };

  for (const skill of SKILL_FIELDS) {
    values[skill] = "";
  }

  return values;
};

const run = async () => {
  await client.connect();
  const db = client.db(dbName);
  const students = db.collection("students");
  const roles = db.collection("roles");
  const settings = db.collection("settings");

  await settings.updateOne(
    { key: "portal" },
    {
      $set: {
        key: "portal",
        skillHeaders: SKILL_FIELDS
      }
    },
    { upsert: true }
  );

  for (const email of allowedEmails) {
    await students.updateOne(
      { email },
      {
        $setOnInsert: {
          email,
          values: buildStudentValues(email)
        }
      },
      { upsert: true }
    );
  }

  for (const email of adminEmails) {
    await roles.updateOne(
      { email },
      {
        $set: {
          email,
          role: "admin"
        }
      },
      { upsert: true }
    );
  }

  await roles.updateOne(
    { email: superAdminEmail },
    {
      $set: {
        email: superAdminEmail,
        role: "super_admin"
      }
    },
    { upsert: true }
  );

  await students.createIndex({ email: 1 }, { unique: true });
  await roles.createIndex({ email: 1 }, { unique: true });

  console.log(`Bootstrapped ${allowedEmails.length} student records.`);
  console.log(`Configured ${adminEmails.size} default admins and 1 super admin.`);
  console.log(`Loaded ${SKILL_FIELDS.length} skill columns.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
