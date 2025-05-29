"use client";

import { useEffect, useState } from "react";
import styles from "./StockLevelChart.module.css";

export default function StockLevelChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/stockLevel")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const maxQty = Math.max(...data.map((item) => item.quantity), 1); // prevent divide-by-zero

  return (
    <div className={styles.chartContainer}>
      <h2 className={styles.title}>Lowest Raw Material Stock</h2>
      {data.map((item, index) => (
        <div key={index} className={styles.barWrapper}>
          <span className={styles.label}>{item.part_number}</span>
          <div className={styles.barOuter}>
            <div
              className={styles.barInner}
              style={{
                width: `${(item.quantity / maxQty) * 100}%`,
              }}
            >
              <span className={styles.qty}>{item.quantity}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
