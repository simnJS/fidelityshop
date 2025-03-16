import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from '../../../lib/prisma';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log('Auth: Identifiants manquants');
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user) {
          console.log(`Auth: Utilisateur '${credentials.username}' non trouvé`);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.log(`Auth: Mot de passe invalide pour '${credentials.username}'`);
          return null;
        }

        console.log(`Auth: Connexion réussie pour '${credentials.username}', ID: ${user.id.substring(0, 8)}...`);
        return {
          id: user.id,
          name: user.username,
          email: user.email || `${user.username}@example.com`,
          isAdmin: user.isAdmin
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.name = user.name;
        console.log('JWT Callback: Token créé/mis à jour pour', user.name);
      } else {
        console.log('JWT Callback: Token existant utilisé');
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.sub || token.id;
        session.user.isAdmin = token.isAdmin;
        if (!session.user.name && token.name) {
          session.user.name = token.name;
        }
        if (!session.user.email) {
          session.user.email = token.email || `${token.name}@example.com`;
        }
        console.log('Session Callback: Session créée/mise à jour pour', session.user.name);
      } else {
        console.log('Session Callback: Pas de token disponible');
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn Callback: Connexion de', user.name);
      return true;
    },
    async signOut({ session, token }) {
      console.log('SignOut Callback: Déconnexion utilisateur', token?.name || 'inconnu');
      return true;
    }
  },
  events: {
    async signOut(message) {
      console.log('Événement signOut déclenché:', message);
    },
    async session(message) {
      console.log('Événement session déclenché:', message);
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 jours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.simnjs.fr' : undefined
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.simnjs.fr' : undefined
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.simnjs.fr' : undefined
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production',
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error [${code}]:`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth Warning [${code}]`);
    },
    debug(code, metadata) {
      console.log(`NextAuth Debug [${code}]:`, metadata);
    }
  }
};

export default NextAuth(authOptions); 