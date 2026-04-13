import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { supabase } from "./supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return false;

      const provider = account.provider as "google" | "linkedin";

      // Upsert user in Supabase
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            email: user.email,
            name: user.name ?? user.email,
            avatar_url: user.image ?? null,
            auth_provider: provider,
          },
          { onConflict: "email" }
        );

      if (error) {
        console.error("Failed to upsert user:", error);
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        // Fetch Supabase user ID and attach to token
        const { data } = await supabase
          .from("users")
          .select("id, daily_limit, apps_today")
          .eq("email", user.email)
          .single();

        if (data) {
          token.userId = data.id;
          token.dailyLimit = data.daily_limit;
          token.appsToday = data.apps_today;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.dailyLimit = token.dailyLimit as number;
        session.user.appsToday = token.appsToday as number;
      }
      return session;
    },
  },
});
