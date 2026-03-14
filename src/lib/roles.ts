import type { Role, RoleAssignment } from "@/types/portal";
import { env } from "@/lib/env";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const resolveRole = (email: string, assignments: RoleAssignment[]): Role => {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === env.superAdminEmail) {
    return "super_admin";
  }

  const sheetRole = assignments.find((item) => normalizeEmail(item.email) === normalizedEmail)?.role;
  if (sheetRole) {
    return sheetRole;
  }

  if (env.defaultAdminEmails.includes(normalizedEmail)) {
    return "admin";
  }

  return "member";
};

export const listAdminEmails = (assignments: RoleAssignment[]) => {
  const adminSet = new Set<string>([...env.defaultAdminEmails, env.superAdminEmail]);

  assignments.forEach((assignment) => {
    if (assignment.role === "admin" || assignment.role === "super_admin") {
      adminSet.add(normalizeEmail(assignment.email));
    }
  });

  return Array.from(adminSet).sort((left, right) => left.localeCompare(right));
};
