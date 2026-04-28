import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "savr-track-secret-key-change-in-production";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // "admin" | "member" | "viewer"
  companyId: string;
  companyName: string;
}

// Roles that can modify data (create, update, delete deadlines/documents)
export function canWrite(user: AuthUser): boolean {
  return user.role === "admin" || user.role === "member";
}

// Roles that can manage team, verify items, access review queue
export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin";
}

// Platform-wide super admin — manages all companies and all users
export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === "superadmin";
}

// Safe user fields to include in API responses (excludes passwordHash)
export const SAFE_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  phone: true,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getUserWithCompany(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });
}
