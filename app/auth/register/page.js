"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RegisterForm from "../../../components/RegisterForm"; // Import the RegisterForm component

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

  return (
    (session.user.role === "admin" || session.user.role === "super") && (
      <RegisterForm />
    )
  );
}
