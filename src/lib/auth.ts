import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import { compare, hash } from "bcrypt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        // Keep active dashboard sessions stable while still refreshing claims.
        maxAge: 8 * 60 * 60, // 8 hours
        updateAge: 5 * 60,   // at most once per 5 minutes
    },
    pages: {
        signIn: "/login"
    },
    providers: [
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            username: { label: "Username or Email", type: "text", placeholder: "Username or Email" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            const usernameOrEmail = credentials?.username?.trim();
            const password = credentials?.password;

            if(!usernameOrEmail || !password) {
                return null;
            }

            const existingUser = await db.user.findFirst({
               where: {
                OR: [
                  { username: usernameOrEmail },
                  { email: usernameOrEmail },
                ],
               }
            })
            
            if(!existingUser || !existingUser.isActive){
                return null;
            }

            const hasHashedPassword = existingUser.password.startsWith("$2");
            const passwordMatch = hasHashedPassword
              ? await compare(password, existingUser.password)
              : password === existingUser.password;
            
            if(!passwordMatch) {
                return null;
            }

            if (!hasHashedPassword) {
              const hashedPassword = await hash(password, 10);
              await db.user.update({
                where: { id: existingUser.id },
                data: { password: hashedPassword },
              });
            }

            return{
                id: `${existingUser.id}`,
                email: existingUser.email,
                username: existingUser.username,
                role: existingUser.role
            }
          }
        })
      ],
      callbacks: {
        async jwt({ token, user }) {
          // Initial sign-in snapshot
          if (user) {
            token.username = user.username;
            token.role = user.role;
            token.id = user.id;
            token.roleSyncedAt = Date.now();
            return token;
          }

          // Periodically re-sync role/status from DB so the UI doesn't stay stale.
          const now = Date.now();
          const last = typeof token.roleSyncedAt === "number" ? token.roleSyncedAt : 0;
          const shouldSync = !last || now - last > 5 * 60_000;

          const userIdStr = (token.sub ?? token.id) as string | undefined;
          const userId = userIdStr ? Number(userIdStr) : NaN;

          if (shouldSync && Number.isFinite(userId)) {
            try {
              const dbUser = await db.user.findUnique({
                where: { id: userId },
                select: { username: true, role: true, isActive: true },
              });

              // User deleted/deactivated -> invalidate session
              if (!dbUser || !dbUser.isActive) {
                return null as any;
              }

              token.username = dbUser.username;
              token.role = dbUser.role;
              token.roleSyncedAt = now;
            } catch {
              // Avoid dropping active users to login on transient DB/network hiccups.
              return token;
            }
          }

          return token;
        },
        async session({ session, token }) {
          return {
            ...session,
            user: {
              ...session.user,
              username: token.username,
              role: token.role,
              id: token.id,
            },
          };
        }
      }      
}


