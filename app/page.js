"use client"; // This ensures it's a client-side component

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StockLevelChart from "@/components/StockLevelChart";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession(); // Fetch session and status using useSession
  const loading = status === "loading"; // Check if the session is loading
  const router = useRouter(); // For redirection

  // If the session is loading, show a loading message
  if (loading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    router.push("/auth");
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.welcome}>Welcome, {session.user.name}!</p>
        <p className={styles.roleInfo}>Your role is: {session.user.role}</p>
      </div>

      {session.user.role === "admin" && (
        <div className={styles.card}>
          <h2>Admin Dashboard</h2>
          <p>You have access to administrative functions and analytics.</p>
          <div className={styles.chartWrapper}>
            <StockLevelChart />
          </div>
        </div>
      )}

      {session.user.role === "normal" && (
        <div className={styles.card}>
          <h2>User Dashboard</h2>
          <p>You have access to operational insights and materials data.</p>
          <div className={styles.chartWrapper}>
            <StockLevelChart />
          </div>
        </div>
      )}
            {session.user.role === "super" && (
        <div className={styles.card}>
          <h2>Super Admin Dashboard</h2>
          <p>You have access to all system features and analytics.</p>
          <div className={styles.chartWrapper}>
            <StockLevelChart />
          </div>
        </div>
      )}
    </div>
  );
}
