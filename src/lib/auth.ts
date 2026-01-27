import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import { compare } from "bcrypt";
import { shouldRefreshSession, clearSessionInvalidation } from "./sessionInvalidation";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
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
              console.log("no email or password", !credentials?.email || !credentials?.password);
              
                return null;
            }

            const existingUser = await db.user.findUnique({
               where: {email: credentials?.email} 
            })

            console.log("existingUser", existingUser);
            
            if(!existingUser || !existingUser.isActive){
                return null;
            }

            const passwordMatch = await compare(credentials.password, existingUser.password);
            console.log("passwordMatch",passwordMatch);
            
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
        async jwt({ token, user, trigger }) {
          // On sign in, set initial token data
          if (user) {
            return {
              ...token,
              username: user.username,
              role: user.role,
              id: user.id,
              lastRefresh: Date.now(),
            };
          }

          // Only refresh when:
          // 1. Explicitly triggered via update() 
          // 2. User has been flagged for session invalidation (by admin)
          const userId = parseInt(token.id as string);
          const needsRefresh = trigger === "update" && shouldRefreshSession(userId);

          if (token.id && needsRefresh) {
            try {
              const dbUser = await db.user.findUnique({
                where: { id: parseInt(token.id as string) },
                select: {
                  id: true,
                  email: true,
                  username: true,
                  role: true,
                  isActive: true,
                },
              });

              // If user not found or inactive, return null to force logout
              if (!dbUser || !dbUser.isActive) {
                return null as any;
              }

              // Clear the invalidation flag
              clearSessionInvalidation(userId);

              // Update token with fresh data from database
              return {
                ...token,
                username: dbUser.username,
                role: dbUser.role,
                email: dbUser.email,
                lastRefresh: Date.now(),
              };
            } catch (error) {
              console.error("Error refreshing token:", error);
              // Return existing token if DB query fails
              return token;
            }
          }

          return token;
        },
        async session({ session, token }) {
          // If token is invalid (user inactive/deleted), return null
          if (!token) {
            return null as any;
          }

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
