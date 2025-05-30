import React, { useState } from "react";
import styles from "./DataModal.module.css";

const DataModal = ({ isOpen, onClose, onSubmit, fields }) => {
  const [formData, setFormData] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button className={styles.close} onClick={onClose}>
          X
        </button>
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field}>
              <label>{field}</label>
              <input
                type="text"
                name={field}
                onChange={handleChange}
                required
              />
            </div>
          ))}
          <button className={styles.submit} type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default DataModal;
