"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MasterDataTable from "../../components/MasterDataTable.js";
import MasterDataModal from "../../components/MasterDataModal.js";
import styles from "./style.module.css";

export default function InsertMasterData() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  const [itemMasterData, setItemMasterData] = useState([]);
  const [locatorData, setLocatorData] = useState([]);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isLocatorModalOpen, setLocatorModalOpen] = useState(false);

  const itemMasterColumns = ["item_id", "part_number", "description"];
  const locatorColumns = ["locator", "warehouse"];

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

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchItemMaster();
      fetchLocator();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAddItem = (formData) => {
    const { item_id, part_number, description } = formData;

    fetch("/api/insertItem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id,
        part_number,
        description,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        fetch("/api/itemMaster")
          .then((res) => res.json())
          .then((data) => setItemMasterData(data));
      });
  };

  // Handle adding new locator
  const handleAddLocator = (formData) => {
    const { locator, warehouse } = formData;

    fetch("/api/insertLocator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locator, warehouse }),
    })
      .then((res) => res.json())
      .then((data) => {
        fetch("/api/locatorMaster")
          .then((res) => res.json())
          .then((data) => setLocatorData(data));
      });
  };

  const openItemModal = () => {
    setLocatorModalOpen(false);
    setItemModalOpen(true);
  };

  const openLocatorModal = () => {
    setItemModalOpen(false);
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
            <MasterDataTable
              data={itemMasterData}
              columns={itemMasterColumns}
            />
          </div>
          <div className={styles.locatorTable}>
            <h2>Locator Master Data</h2>
            <MasterDataTable data={locatorData} columns={locatorColumns} />
          </div>
        </div>
      </div>
      {/* Modal for adding new item */}
      <MasterDataModal
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSubmit={handleAddItem}
        fields={itemMasterColumns}
      />
      {/* Modal for adding new locator */}
      <MasterDataModal
        isOpen={isLocatorModalOpen}
        onClose={() => setLocatorModalOpen(false)}
        onSubmit={handleAddLocator}
        fields={locatorColumns}
      />
    </div>
  );
}
