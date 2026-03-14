import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/lib/env";
import { hasStudentEmail } from "@/lib/portal-store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.authSecret,
  trustHost: true,
  providers: [
    Google({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();

      if (!email) {
        return false;
      }

      if (env.allowedUserEmails.length > 0) {
        if (env.allowedUserEmails.includes(email)) {
          return true;
        }

        return hasStudentEmail(email);
      }

      if (!env.institutionalEmailDomain) {
        return true;
      }

      return email.endsWith(`@${env.institutionalEmailDomain}`);
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }

      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
});
