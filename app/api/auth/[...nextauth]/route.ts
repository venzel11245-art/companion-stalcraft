import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'stalzone',
      name: 'Stalzone (EXBO)',
      type: 'oauth',
      authorization: {
        url: 'https://exbo.net/oauth/authorize',
        params: { 
          scope: '', // Документация говорит оставить пустым пока
          response_type: 'code'
        },
      },
      token: 'https://exbo.net/oauth/token',
      userinfo: 'https://eapi.stalcraft.net/api/v1/user',
      clientId: process.env.STALZONE_CLIENT_ID,
      clientSecret: process.env.STALZONE_CLIENT_SECRET,
      profile(profile: any) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // @ts-ignore
      session.accessToken = token.accessToken as string
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-key-change-this-in-production-12345',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }