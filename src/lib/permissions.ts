import { type PortalDataset } from "@/types/portal";

export const canEditField = (dataset: PortalDataset, targetEmail: string, header: string) => {
  if (dataset.role === "super_admin" || dataset.role === "admin") {
    return header !== "Reward Points";
  }

  if (dataset.role !== "member" || dataset.userEmail !== targetEmail.toLowerCase()) {
    return false;
  }

  if (dataset.skillHeaders.includes(header)) {
    return true;
  }

  if (dataset.detailHeaders.includes(header)) {
    return true;
  }

  return header === "Activity Points";
};

export const canManageRoles = (dataset: PortalDataset) => dataset.role === "super_admin";

export const canManageSkills = (dataset: PortalDataset) =>
  dataset.role === "admin" || dataset.role === "super_admin";

export const canManageTargets = (dataset: PortalDataset) =>
  dataset.role === "admin" || dataset.role === "super_admin";

export const canManageMembers = (dataset: PortalDataset) => dataset.role === "super_admin";
