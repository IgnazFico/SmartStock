"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RegisterForm from "../../../components/RegisterForm";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    router.push("/auth"); // redirect jika belum login
    return null;
  }

  const userRole = session.user?.role;

  // Redirect jika user bukan admin atau super
  if (userRole !== "admin" && userRole !== "super") {
    router.push("/unauthorized");
    return null;
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>Register New User</h1>
      <RegisterForm />
    </main>
  );
}
