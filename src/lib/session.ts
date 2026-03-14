import { auth } from "@/auth";

export const requireSession = async () => {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  return session;
};
