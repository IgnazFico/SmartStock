"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DataTable from "../../components/DataTable.js";
import DataModal from "../../components/DataModal";
import styles from "./style.module.css";

export default function InsertMasterData() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  const [itemMasterData, setItemMasterData] = useState([]);
  const [locatorData, setLocatorData] = useState([]);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isLocatorModalOpen, setLocatorModalOpen] = useState(false);

  // Columns for tables
  const itemMasterColumns = [
    "part_number",
    "description",
    "quantity",
    "supplier",
    "customer",
  ];
  const locatorColumns = ["locator"];

  // Fetch data from APIs (replace with actual fetch URLs)
  useEffect(() => {
    const fetchItemMaster = async () => {
      const response = await fetch("/api/itemMaster");
      const data = await response.json();
      setItemMasterData(data);
    };

    const fetchLocator = async () => {
      const response = await fetch("/api/locatorMaster");
      const data = await response.json();
      setLocatorData(data);
    };

    fetchItemMaster();
    fetchLocator();
  }, []);

  // Handle adding new item
  const handleAddItem = (formData) => {
    const { part_number, description, quantity, supplier, customer } = formData;

    fetch("/api/insertItem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part_number,
        description,
        quantity,
        supplier,
        customer,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setItemMasterData((prev) => [...prev, data]);
      });
  };

  // Handle adding new locator
  const handleAddLocator = (formData) => {
    const { locator } = formData;

    fetch("/api/insertLocator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locator }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLocatorData((prev) => [...prev, data]);
      });
  };

  // Functions to open modals and close the other if it's open
  const openItemModal = () => {
    setLocatorModalOpen(false); // Close locator modal if open
    setItemModalOpen(true);
  };

  const openLocatorModal = () => {
    setItemModalOpen(false); // Close item modal if open
    setLocatorModalOpen(true);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    router.push("/auth");
    return null;
  }

  return (
    <div className={styles.container}>
      <div>
        <h1>Master Data</h1>
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={openItemModal}>
            Add New Item
          </button>
          <button className={styles.button} onClick={openLocatorModal}>
            Add New Locator
          </button>
        </div>

        <div className={styles.tablesContainer}>
          <div className={styles.itemsTable}>
            <h2>Item Master Data</h2>
            <DataTable data={itemMasterData} columns={itemMasterColumns} />
          </div>
          <div className={styles.locatorTable}>
            <h2>Locator Master Data</h2>
            <DataTable data={locatorData} columns={locatorColumns} />
          </div>
        </div>
      </div>
      {/* Modal for adding new item */}
      <DataModal
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSubmit={handleAddItem}
        fields={itemMasterColumns}
      />
      {/* Modal for adding new locator */}
      <DataModal
        isOpen={isLocatorModalOpen}
        onClose={() => setLocatorModalOpen(false)}
        onSubmit={handleAddLocator}
        fields={locatorColumns}
      />
    </div>
  );
}
