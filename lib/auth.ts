import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, hashPassword, hashSessionToken, normalizeEmail, verifyPassword } from "@/lib/auth-utils";

export const SESSION_COOKIE_NAME = "familyos_session";
const SESSION_DAYS = 30;

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  familyName: z.string().trim().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function sessionExpiresAt() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DAYS);
  return date;
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = sessionExpiresAt();

  await db.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  await setSessionCookie(token, expiresAt);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: {
          familyUsers: {
            include: { family: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } }).catch(() => null);
    }
    await clearSessionCookie();
    return null;
  }

  await db.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function registerAction(formData: FormData) {
  "use server";

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    familyName: formData.get("familyName"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const email = normalizeEmail(parsed.data.email);
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    redirect("/register?error=email-exists");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        passwordHash,
      },
    });

    const family = await tx.family.create({
      data: { name: parsed.data.familyName.trim() },
    });

    await tx.familyUser.create({
      data: {
        userId: createdUser.id,
        familyId: family.id,
        role: "owner",
      },
    });

    return createdUser;
  });

  await createSession(user.id);
  redirect("/app");
}

export async function loginAction(formData: FormData) {
  "use server";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const user = await db.user.findUnique({
    where: { email: normalizeEmail(parsed.data.email) },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  redirect("/app");
}

export async function logoutAction() {
  "use server";

  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.session.delete({ where: { tokenHash: hashSessionToken(token) } }).catch(() => null);
  }
  await clearSessionCookie();
  redirect("/login");
}
