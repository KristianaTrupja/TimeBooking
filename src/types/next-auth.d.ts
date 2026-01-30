import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    role: string;
    id?: string;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    role: string;
    id?: string;
    roleSyncedAt?: number;
  }
}
