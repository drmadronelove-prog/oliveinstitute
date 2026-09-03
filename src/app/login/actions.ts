"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { withBasePath } from "@/lib/basePath";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
};

/**
 * Signs in on the server rather than through `next-auth/react`. The client
 * helper builds its request URL from `NEXTAUTH_URL` and so ignores the
 * app's basePath; the server `signIn` uses the `basePath` configured in
 * `src/lib/auth.ts`, keeping that knowledge in one place.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    // Auth.js resolves redirectTo against the origin, so the prefix is ours.
    await signIn("credentials", {
      email,
      password,
      redirectTo: withBasePath("/dashboard"),
    });
  } catch (error) {
    // A successful sign-in throws NEXT_REDIRECT, which must propagate.
    if (error instanceof AuthError) {
      return { status: "error", message: "Invalid email or password." };
    }
    throw error;
  }

  return { status: "idle" };
}
