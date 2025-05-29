"use client";

import { useSession } from "next-auth/react";
import styles from "./NavBar.module.css";
import { signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession(); // Get session and status
  const loading = status === "loading"; // Check if the session is loading

  const role = session?.user?.role; // Check if the user is a super user

  function handleLogOut() {
    signOut();
  }

  return (
    <div className={styles.container}>
      <nav className={styles.verticalNav}>
        <div className={styles.company}>
          <img className={styles.logo} alt="Printec" src="/favicon.ico" />
          <h3>Printec</h3>
        </div>
        <hr className={styles.rounded}></hr>
        <ul className={styles.list}>
          <li>
            <a href="/scan">
              <img src="/scan-svgrepo-com.svg" alt="Scan" />
              Scan
            </a>
          </li>
          <li>
            <a href="/log">
              <img src="/log-svgrepo-com.svg" alt="Log" />
              Log
            </a>
          </li>
          <li>
            <a href="/inventory">
              <img src="/inventory_icon.png" alt="Inventory" />
              Inventory
            </a>
          </li>
          <li>
            <a href="/print">
              <img src="/print-svgrepo-com.svg" alt="Print" />
              Print
            </a>
          </li>
          <li>
            <a href="/production">
              <img src="" alt="Production" />
              Production
            </a>
          </li>
          <li>
            <a href="/production-tracking">
              <img src="" alt="Production Tracking" />
              Production Tracking
            </a>
          </li>
          <li>
            <a href="/purchasing">
              <img src="" alt="Purchasing" />
              Purchasing
            </a>
          </li>
          {(role === "super" || role === "admin") && (
            <li>
              <a href="auth/register">
                <img src="/add-user-svgrepo-com.svg" alt="Register" />
                Register
              </a>
            </li>
          )}
          {(role === "super" || role === "admin") && (
            <li>
              <a href="/master_data">
                <img src="/master-data.png" alt="Master Data" />
                Master Data
              </a>
            </li>
          )}

          <li>
            <a onClick={handleLogOut} href="/auth">
              <img src="/login-svgrepo-com.svg" alt="Logout Icon" />
              Logout
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
