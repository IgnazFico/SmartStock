"use client";

import React, { useEffect, useState } from "react";
import ReceivingTable from "@/components/ReceivingTable";
import styles from "./style.module.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ReceivingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  
    useEffect(() => {
    // Autentikasi
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    // Fetch data hanya jika sudah login
    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          const res = await fetch("/api/receiving");
          if (!res.ok) throw new Error("Gagal ambil data");
          const data = await res.json();
          setRecords(data);
        } catch (err) {
          console.error("Gagal ambil data:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [status]);

  if (status === "loading" || loading) return <p>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Receiving</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ReceivingTable records={records} refreshData={() => window.location.reload()} />
      )}
    </div>
  );
}
