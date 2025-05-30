"use client";

import React, { useEffect, useState } from "react";
import ReceivingTable from "@/components/ReceivingTable";
import styles from "./style.module.css";

export default function ReceivingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/receiving");
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error("Gagal ambil data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
