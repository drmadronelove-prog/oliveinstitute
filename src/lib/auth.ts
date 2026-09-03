import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BASE_PATH, withBasePath } from "@/lib/basePath";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Self-hosted deployments (not Vercel) don't get automatic host
  // detection — without this, Auth.js rejects every request in
  // production with "UntrustedHost". Safe here because this app is
  // deployed behind infrastructure we control, not accepting arbitrary
  // inbound Host headers from the public internet without a reverse
  // proxy in front. See https://errors.authjs.dev#untrustedhost
  trustHost: true,
  // The app is mounted under Next's basePath, so the Auth.js route
  // handler lives at `${BASE_PATH}/api/auth` rather than `/api/auth`.
  // Auth.js builds its own callback URLs from this, so it has to be told.
  basePath: `${BASE_PATH}/api/auth`,
  session: { strategy: "jwt" },
  pages: {
    // Auth.js treats this as an origin-relative URL, so it carries the
    // prefix explicitly.
    signIn: withBasePath("/login"),
  },
  // Scope the session cookie to the base path: nothing outside
  // `${BASE_PATH}` is part of this app, so nothing outside it should
  // receive the token. Auth.js only adds the `__Secure-` prefix (never
  // `__Host-`, which would force `path=/`), so a narrowed path is safe.
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: BASE_PATH,
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "INSTRUCTOR" | "LEARNER";
      }
      return session;
    },
  },
});
