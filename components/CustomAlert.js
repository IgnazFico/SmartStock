import React from "react";
import styles from "./CustomAlert.module.css";

export default function CustomAlert({ message, type = "info", onClose }) {
  if (!message) return null;
  return (
    <div className={styles.alertModalOverlay}>
      <div className={`${styles.alert} ${styles[type]}`}>
        <span>{message}</span>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>
    </div>
  );
}
  