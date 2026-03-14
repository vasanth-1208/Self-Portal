"use server";

import { signIn, signOut } from "@/auth";

export const signInWithGoogle = async () => {
  await signIn("google", {
    redirectTo: "/"
  });
};

export const signOutUser = async () => {
  await signOut({
    redirectTo: "/login"
  });
};
