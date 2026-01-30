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
        async jwt({ token, user }) {
          if (user) {
            return {
              ...token,
              username: user.username,
              role: user.role,
              id: user.id,
            };
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