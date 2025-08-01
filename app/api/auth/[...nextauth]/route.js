import NextAuth from "next-auth/next";
import Credentials from "next-auth/providers/credentials";
import connect from "../../../../utils/db";
import { verifyPassword } from "../../../../utils/auth"; // Assuming you have a password verification function

// Auth options with credentials provider
const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // Using JWT strategy for session
    maxAge: 15 * 60,
    updateAge: 5 * 60,
  },
  jwt: {
    maxAge: 15 * 60,
  },
  pages: {
    signIn: "/auth", // Redirect to login page if unauthenticated
  },
  callbacks: {
    // Modify the JWT token to include role
    async jwt({ token, user }) {
      if (user) {
        token.users_ID = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.department = user.department;
        token.position = user.position;
      }
      console.log("=== [JWT CALLBACK] token ===", token);
      return token;
    },
    // Add the user role to the session object
    async session({ session, token }) {
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role;
      session.user.users_ID = token.users_ID;
      session.user.department = token.department;
      session.user.position = token.position;

      console.log("=== [SESSION CALLBACK] session ===", session);
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "********",
        },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;

        // Connect to MongoDB
        const client = await connect();

        // Find user by email
        const usersCollection = client.collection("user");
        const user = await usersCollection.findOne({ email });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password); // Assuming passwords are hashed in the DB
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Return user object, including the role from the database
        return {
          id: user.users_ID,
          name: user.name,
          email: user.email,
          role: user.role, // Extract role from the database
          department: user.department,
          position: user.position,
        };
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
