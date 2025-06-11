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

  const lowStockItems = data.filter(
    (item) => item.threshold !== undefined && item.quantity < item.threshold
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
        {lowStockItems.length > 0 && (
          <div className={styles.notificationBox}>
            <h3 className={styles.notificationTitle}>⚠️ Low Stock Alerts</h3>
            <ul className={styles.alertList}>
              {lowStockItems.map((item, idx) => (
                <li key={idx} className={styles.alertItem}>
                  <strong>{item.part_number}</strong> is below threshold.
                  Current: {item.quantity}, Threshold: {item.threshold}
                  <button
                    className={styles.requestBtn}
                    onClick={() => router.push("/pr")}
                  >
                    Request
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
