import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        // Refresh the JWT periodically so role/status changes propagate
        maxAge: 30 * 60, // 30 minutes
        updateAge: 60,   // at most once per minute
    },
    pages: {
        signIn: "/login"
    },
    providers: [
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            email: { label: "Email", type: "text", placeholder: "Email" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            if(!credentials?.email || !credentials?.password) {
                return null;
            }

            const existingUser = await db.user.findUnique({
               where: {email: credentials?.email} 
            })
            
            if(!existingUser || !existingUser.isActive){
                return null;
            }

            const passwordMatch = await compare(credentials.password, existingUser.password);
            
            if(!passwordMatch) {
                return null;
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
          const shouldSync = !last || now - last > 60_000;

          const userIdStr = (token.sub ?? token.id) as string | undefined;
          const userId = userIdStr ? Number(userIdStr) : NaN;

          if (shouldSync && Number.isFinite(userId)) {
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


