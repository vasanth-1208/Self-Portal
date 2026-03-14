const DEFAULT_ADMIN_EMAILS = [
  "vbalakumar.cs24@bitsathy.ac.in",
  "dhivyab.it24@bitsathy.ac.in",
  "shobikap.cs24@bitsathy.ac.in",
  "vasantharajm.cs24@bitsathy.ac.in",
  "thamaraimanalanr.cs24@bitsathy.ac.in"
];

const DEFAULT_ALLOWED_USER_EMAILS = [
  "vbalakumar.cs24@bitsathy.ac.in",
  "dhivyab.it24@bitsathy.ac.in",
  "shobikap.cs24@bitsathy.ac.in",
  "vasantharajm.cs24@bitsathy.ac.in",
  "surendharr.cs24@bitsathy.ac.in",
  "thamaraimanalanr.cs24@bitsathy.ac.in",
  "anishd.cs24@bitsathy.ac.in",
  "vijayprakasha.cs24@bitsathy.ac.in",
  "dharshinisr.it24@bitsathy.ac.in",
  "selvasobikam.cs24@bitsathy.ac.in",
  "poovarasank.cs25@bitsathy.ac.in",
  "ajaykrishnap.cs25@bitsathy.ac.in",
  "dineshkumark.ad25@bitsathy.ac.in",
  "maajithk.cs25@bitsathy.ac.in",
  "dulasidassvm.cs25@bitsathy.ac.in"
];

const DEFAULT_SUPER_ADMIN_EMAIL = "vasantharajm.cs24@bitsathy.ac.in";

const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  authSecret: required("AUTH_SECRET"),
  authUrl: process.env.AUTH_URL,
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
  institutionalEmailDomain: process.env.INSTITUTIONAL_EMAIL_DOMAIN?.toLowerCase() ?? "",
  mongodbUri: required("MONGODB_URI"),
  mongodbDbName: process.env.MONGODB_DB_NAME || "a100005",
  allowedUserEmails: (process.env.ALLOWED_USER_EMAILS || DEFAULT_ALLOWED_USER_EMAILS.join(","))
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  defaultAdminEmails: (process.env.DEFAULT_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL).toLowerCase()
};
