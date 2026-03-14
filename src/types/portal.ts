export const BASIC_FIELDS = [
  "Names",
  "Position",
  "Phone Number",
  "Special Lab Name",
  "Email",
  "Roll Number",
  "Google Sheet",
  "Reward Points",
  "Activity Points"
] as const;

export const DIRECTORY_FIELDS = [
  "Names",
  "Position",
  "Phone Number",
  "Special Lab Name",
  "Email",
  "Roll Number"
] as const;

export type BasicField = (typeof BASIC_FIELDS)[number];
export type DirectoryField = (typeof DIRECTORY_FIELDS)[number];
export type Role = "member" | "admin" | "super_admin";

export type StudentRow = {
  id: string;
  values: Record<string, string>;
  targetSkills: string[];
};

export type DirectoryRow = {
  id: string;
  values: Record<DirectoryField, string>;
};

export type PortalDataset = {
  role: Role;
  userEmail: string;
  headers: string[];
  detailHeaders: string[];
  skillHeaders: string[];
  students: StudentRow[];
  ownRow: StudentRow | null;
  directory: DirectoryRow[];
  adminEmails: string[];
  superAdminEmail: string;
  teamViewLoaded: boolean;
};

export type RoleAssignment = {
  email: string;
  role: Exclude<Role, "member">;
};
