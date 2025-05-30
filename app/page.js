"use client"; // This ensures it's a client-side component

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // useRouter for redirect

export default function Dashboard() {
  const { data: session, status } = useSession(); // Fetch session and status using useSession
  const loading = status === "loading"; // Check if the session is loading
  const router = useRouter(); // For redirection

  // If the session is loading, show a loading message
  if (loading) {
    return <p>Loading...</p>;
  }

  // If no session is found, redirect to login page
  if (!session) {
    router.push("/auth"); // Redirect to the login page
    return null; // Prevent rendering before redirect
  }

  // Function to handle logout
  function logoutHandler() {
    signOut(); // Sign the user out
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Your role is: {session.user.role}</p>

      {/* Render additional information based on user role */}
      {session.user.role === "super" && (
        <div>
          <h1>Dashboard</h1>
          <h2>Super User Actions</h2>
          <p>You have access to admin features.</p>
        </div>
      )}

      {session.user.role === "normal" && (
        <div>
          <h2>Normal User Actions</h2>
          <p>You have access to normal user features.</p>
        </div>
      )}

      {/* Logout button */}
      <button onClick={logoutHandler}>Logout</button>
    </div>
  );
}
