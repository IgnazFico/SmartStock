"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./StockLevelChart.module.css";

export default function StockLevelChart() {
  const [data, setData] = useState([]);

  const router = useRouter();

  useEffect(() => {
    fetch("/api/stockLevel")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const maxQty = Math.max(...data.map((item) => item.quantity), 1); // prevent divide-by-zero

  // Critical: below threshold, Warning: equal or near (within 10%)
  const criticalItems = data.filter(
    (item) => item.threshold !== undefined && item.quantity < item.threshold
  );
  const warningItems = data.filter(
    (item) => {
      if (item.threshold === undefined) return false;
      const near = item.quantity >= item.threshold && item.quantity <= item.threshold + Math.max(1, Math.round(item.threshold * 0.1));
      return near;
    }
  );

  return (
    <div className={styles.splitLayout}>
      {/* Left: Chart Section */}
      <div className={styles.leftPanel}>
        <h2 className={styles.title}>Lowest Raw Material Stock</h2>
        {data.map((item, index) => (
          <div key={index} className={styles.barWrapper}>
            <span className={styles.label}>{item.part_number}</span>
            <div className={styles.barOuter}>
              <div
                className={styles.barInner}
                style={{
                  width: `${(item.quantity / maxQty) * 100}%`,
                  backgroundColor:
                    item.quantity < item.threshold
                      ? "#e63946"
                      : item.quantity === item.threshold
                      ? "#f1c40f"
                      : "#1d3557",
                }}
              >
                <span className={styles.qty}>{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Notification Section */}
      <div className={styles.rightPanel}>
        {criticalItems.length > 0 && (
          <div className={styles.notificationBox} style={{ background: '#ffeaea', border: '1.5px solid #e63946' }}>
            <h3 className={styles.notificationTitle} style={{ color: '#e63946' }}>🛑 Critical Stock Alert</h3>
            <ul className={styles.alertList}>
              {criticalItems.map((item, idx) => (
                <li key={idx} className={styles.alertItem}>
                  <strong>{item.part_number}</strong> is below threshold.
                  Current: {item.quantity}, Threshold: {item.threshold}
                  <button
                    className={styles.requestBtn}
                    style={{ background: '#e63946', color: '#fff', border: 'none' }}
                    onClick={() => router.push("/po")}
                  >
                    Create PO
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {warningItems.length > 0 && (
          <div className={styles.notificationBox} style={{ background: '#fff8e1', border: '1.5px solid #f1c40f', marginTop: criticalItems.length > 0 ? 16 : 0 }}>
            <h3 className={styles.notificationTitle} style={{ color: '#f1c40f' }}>⚠️ Low Stock Warning</h3>
            <ul className={styles.alertList}>
              {warningItems.map((item, idx) => (
                <li key={idx} className={styles.alertItem}>
                  <strong>{item.part_number}</strong> is at or near threshold.
                  Current: {item.quantity}, Threshold: {item.threshold}
                  <button
                    className={styles.requestBtn}
                    style={{ background: '#f1c40f', color: '#333', border: 'none' }}
                    onClick={() => router.push("/pr")}
                  >
                    Create PR
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
