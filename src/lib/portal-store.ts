import { ObjectId } from "mongodb";
import { env } from "@/lib/env";
import { getDatabase } from "@/lib/mongodb";
import { listAdminEmails, normalizeEmail, resolveRole } from "@/lib/roles";
import {
  BASIC_FIELDS,
  DIRECTORY_FIELDS,
  type DirectoryField,
  type PortalDataset,
  type Role,
  type RoleAssignment,
  type StudentRow
} from "@/types/portal";

type StudentDocument = {
  _id?: ObjectId;
  email?: string;
  values: Record<string, string>;
  targetSkills?: string[];
};

type RoleDocument = {
  _id?: ObjectId;
  email: string;
  role: Exclude<Role, "member">;
};

type SettingsDocument = {
  _id?: ObjectId;
  key: "portal";
  detailHeaders: string[];
  skillHeaders: string[];
};

const STUDENTS_COLLECTION = "students";
const ROLES_COLLECTION = "roles";
const SETTINGS_COLLECTION = "settings";
const REWARD_POINTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/17HxRjLE7WPWNP1dLRO1jmMdPqqjyX0BSFf25kOcx44A/export?format=csv&gid=161766863";

const studentSort = { "values.Names": 1, email: 1 } as const;

const DEFAULT_DETAIL_HEADERS = [
  "Github",
  "Linkedin",
  "Primary Skill 1",
  "Primary Skill 2",
  "Project domain",
  "Secondary Skill 1",
  "Secondary Skill 2",
  "Specialized skill 1",
  "Specialized skill 2",
  "X (Twitter)"
];

const getCollections = async () => {
  const db = await getDatabase();

  return {
    students: db.collection<StudentDocument>(STUDENTS_COLLECTION),
    roles: db.collection<RoleDocument>(ROLES_COLLECTION),
    settings: db.collection<SettingsDocument>(SETTINGS_COLLECTION)
  };
};

const ensureSettings = async () => {
  const { settings } = await getCollections();

  await settings.updateOne(
    { key: "portal" },
    {
      $setOnInsert: {
        key: "portal",
        detailHeaders: DEFAULT_DETAIL_HEADERS.slice(),
        skillHeaders: []
      }
    },
    { upsert: true }
  );
};

const ensureDefaultDetailColumns = async () => {
  await ensureSettings();
  const { settings, students } = await getCollections();
  const document = await settings.findOne({ key: "portal" });

  const current = new Set((document?.detailHeaders ?? []).map((header) => `${header}`));
  const missing = DEFAULT_DETAIL_HEADERS.filter((header) => !current.has(header));

  if (missing.length === 0) {
    return;
  }

  await settings.updateOne(
    { key: "portal" },
    {
      $addToSet: {
        detailHeaders: { $each: missing }
      }
    }
  );

  for (const header of missing) {
    await students.updateMany(
      { [`values.${header}`]: { $exists: false } },
      {
        $set: {
          [`values.${header}`]: ""
        }
      }
    );
  }
};

const getPortalColumns = async () => {
  await ensureDefaultDetailColumns();
  const { settings } = await getCollections();
  const document = await settings.findOne({ key: "portal" });

  return {
    detailHeaders: (document?.detailHeaders ?? [])
      .slice()
      .sort((left, right) => left.localeCompare(right)),
    skillHeaders: (document?.skillHeaders ?? [])
      .slice()
      .sort((left, right) => left.localeCompare(right))
  };
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const getLiveRewardPoints = async () => {
  try {
    const response = await fetch(REWARD_POINTS_CSV_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      return new Map<string, string>();
    }

    const csv = await response.text();
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return new Map<string, string>();
    }

    const header = parseCsvLine(lines[0]);
    const emailIndex = header.findIndex((value) => value.trim() === "Email");
    const rewardPointsIndex = header.findIndex((value) => value.trim() === "Reward Points");

    if (emailIndex === -1 || rewardPointsIndex === -1) {
      return new Map<string, string>();
    }

    const rewardMap = new Map<string, string>();

    lines.slice(1).forEach((line) => {
      const values = parseCsvLine(line);
      const email = normalizeEmail(values[emailIndex] || "");
      const rewardPoints = `${values[rewardPointsIndex] || ""}`.trim();

      if (email) {
        rewardMap.set(email, rewardPoints);
      }
    });

    return rewardMap;
  } catch {
    return new Map<string, string>();
  }
};

const getStudentEmail = (student: StudentDocument) =>
  normalizeEmail(student.email || student.values.Email || "");

const mapStudentRow = (student: StudentDocument): StudentRow => ({
  id: student._id!.toHexString(),
  values: {
    ...student.values,
    Email: student.values.Email || student.email || ""
  },
  targetSkills: (student.targetSkills ?? []).slice().sort((left, right) => left.localeCompare(right))
});

const getStudents = async () => {
  const { students } = await getCollections();
  return students.find({}, { sort: studentSort }).toArray();
};

export const getRoleAssignments = async (): Promise<RoleAssignment[]> => {
  const { roles } = await getCollections();
  const assignments = await roles.find({}).toArray();

  return assignments.map((assignment) => ({
    email: assignment.email,
    role: assignment.role
  }));
};

export const hasStudentEmail = async (email: string) => {
  const { students } = await getCollections();
  const student = await students.findOne({
    email: normalizeEmail(email)
  });

  return Boolean(student);
};

export const getPortalDataset = async (email: string): Promise<PortalDataset> => {
  return getPortalDatasetWithOptions(email, { includeTeamData: true });
};

export const getPortalDatasetWithOptions = async (
  email: string,
  options?: { includeTeamData?: boolean }
): Promise<PortalDataset> => {
  const normalizedEmail = normalizeEmail(email);
  const [students, assignments, columns, rewardPointsMap] = await Promise.all([
    getStudents(),
    getRoleAssignments(),
    getPortalColumns(),
    getLiveRewardPoints()
  ]);

  const role = resolveRole(normalizedEmail, assignments);
  const headers = [...BASIC_FIELDS, ...columns.detailHeaders, ...columns.skillHeaders];
  const includeTeamData = options?.includeTeamData ?? true;
  const studentsWithLivePoints = students.map((student) => {
    const studentEmail = getStudentEmail(student);
    const rewardPoints = rewardPointsMap.get(studentEmail);
    const nextValues: Record<string, string> = {
      ...student.values,
      Email: student.values.Email || student.email || "",
      "Reward Points": rewardPoints ?? student.values["Reward Points"] ?? "0"
    };

    return {
      ...student,
      values: nextValues
    };
  });

  const ownStudent =
    studentsWithLivePoints.find((student) => getStudentEmail(student) === normalizedEmail) || null;
  const directory = studentsWithLivePoints
    .slice()
    .sort((left, right) => {
      const positionCompare = `${left.values.Position || ""}`.localeCompare(
        `${right.values.Position || ""}`
      );

      if (positionCompare !== 0) {
        return positionCompare;
      }

      return `${left.values.Names || ""}`.localeCompare(`${right.values.Names || ""}`);
    })
    .map((student) => ({
    id: student._id!.toHexString(),
    values: DIRECTORY_FIELDS.reduce((accumulator, field) => {
      accumulator[field] = student.values[field] || "";
      return accumulator;
    }, {} as Record<DirectoryField, string>)
    }));

  return {
    role,
    userEmail: normalizedEmail,
    headers,
    detailHeaders: columns.detailHeaders,
    skillHeaders: columns.skillHeaders,
    students: includeTeamData ? studentsWithLivePoints.map(mapStudentRow) : [],
    ownRow: ownStudent ? mapStudentRow(ownStudent) : null,
    directory: role === "member" || !includeTeamData ? directory : [],
    adminEmails: listAdminEmails(assignments),
    superAdminEmail: env.superAdminEmail,
    teamViewLoaded: role === "member" ? true : includeTeamData
  };
};

export const updateStudentCell = async (studentId: string, header: string, value: string) => {
  const { students } = await getCollections();
  const update: Record<string, string> = {
    [`values.${header}`]: value
  };

  if (header === "Email") {
    update.email = normalizeEmail(value);
  }

  await students.updateOne(
    { _id: new ObjectId(studentId) },
    {
      $set: update
    }
  );
};

export const updateSkillTarget = async (studentId: string, header: string, targeted: boolean) => {
  const { students } = await getCollections();

  await students.updateOne(
    { _id: new ObjectId(studentId) },
    targeted
      ? {
          $addToSet: {
            targetSkills: header
          }
        }
      : {
          $pull: {
            targetSkills: header
          }
        }
  );
};

export const addSkillColumn = async (header: string) => {
  const { settings, students } = await getCollections();

  await ensureSettings();
  await settings.updateOne(
    { key: "portal" },
    {
      $addToSet: {
        skillHeaders: header
      }
    }
  );

  await students.updateMany(
    { [`values.${header}`]: { $exists: false } },
    {
      $set: {
        [`values.${header}`]: ""
      }
    }
  );
};

export const addDetailColumn = async (header: string) => {
  const { settings, students } = await getCollections();

  await ensureSettings();
  await settings.updateOne(
    { key: "portal" },
    {
      $addToSet: {
        detailHeaders: header
      }
    }
  );

  await students.updateMany(
    { [`values.${header}`]: { $exists: false } },
    {
      $set: {
        [`values.${header}`]: ""
      }
    }
  );
};

export const deleteSkillColumn = async (header: string) => {
  const { settings, students } = await getCollections();

  await settings.updateOne(
    { key: "portal" },
    {
      $pull: {
        skillHeaders: header
      }
    }
  );

  await students.updateMany(
    {},
    {
      $unset: {
        [`values.${header}`]: ""
      }
    }
  );
};

export const deleteDetailColumn = async (header: string) => {
  const { settings, students } = await getCollections();

  await settings.updateOne(
    { key: "portal" },
    {
      $pull: {
        detailHeaders: header
      }
    }
  );

  await students.updateMany(
    {},
    {
      $unset: {
        [`values.${header}`]: ""
      }
    }
  );
};

export const upsertRole = async (email: string, role: Exclude<Role, "member">) => {
  const { roles } = await getCollections();
  const normalizedEmail = normalizeEmail(email);

  await roles.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        role
      }
    },
    { upsert: true }
  );
};

export const removeRole = async (email: string) => {
  const { roles } = await getCollections();
  await roles.deleteOne({ email: normalizeEmail(email) });
};

export const createMember = async (values: Record<string, string>) => {
  const { students, settings } = await getCollections();
  const email = normalizeEmail(values.Email || "");

  if (!email) {
    throw new Error("Email is required.");
  }

  await ensureDefaultDetailColumns();
  const setting = await settings.findOne({ key: "portal" });
  const skillHeaders = setting?.skillHeaders ?? [];
  const detailHeaders = setting?.detailHeaders ?? [];
  const baseValues = BASIC_FIELDS.reduce((accumulator, field) => {
    accumulator[field] = field === "Reward Points" || field === "Activity Points" ? "0" : "";
    return accumulator;
  }, {} as Record<string, string>);
  const nextValues: Record<string, string> = { ...baseValues, ...values, Email: email };

  detailHeaders.forEach((header) => {
    if (!(header in nextValues)) {
      nextValues[header] = "";
    }
  });

  skillHeaders.forEach((header) => {
    if (!(header in nextValues)) {
      nextValues[header] = "";
    }
  });

  await students.insertOne({
    email,
    values: nextValues,
    targetSkills: []
  });
};

export const deleteMember = async (studentId: string) => {
  const { students, roles } = await getCollections();
  const student = await students.findOne({ _id: new ObjectId(studentId) });

  if (!student) {
    return;
  }

  await students.deleteOne({ _id: student._id });

  const email = normalizeEmail(student.email || student.values.Email || "");
  if (email) {
    await roles.deleteOne({ email });
  }
};
