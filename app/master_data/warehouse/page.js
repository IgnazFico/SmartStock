"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DataTable from "../../../components/DataTable.js";
import DataModal from "../../../components/DataModal.js";
import styles from "./style.module.css";

export default function InsertMasterData() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  const [locatorData, setLocatorData] = useState([]);
  const [warehouseData, setWarehouseData] = useState([]);
  const [isLocatorModalOpen, setLocatorModalOpen] = useState(false);
  const [isWarehouseModalOpen, setWarehouseModalOpen] = useState(false);

  const locatorColumns = ["locator", "warehouse"];
  const warehouseColumns = ["warehouse_ID", "warehouse"];

  useEffect(() => {
    const fetchLocator = async () => {
      const response = await fetch("/api/locatorMaster");
      const data = await response.json();
      setLocatorData(data);
    };
    const fetchWarehouse = async () => {
      const response = await fetch("/api/warehouseMaster");
      const data = await response.json();
      setWarehouseData(data);
    };

    fetchLocator();
    fetchWarehouse();

    const interval = setInterval(() => {
      fetchLocator();
      fetchWarehouse();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleAddLocator = (formData) => {
    const { locator, warehouse } = formData;

    fetch("/api/insertLocator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locator, warehouse }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLocatorData((prev) => [...prev, data]);
      });
  };

  const openLocatorModal = () => {
    setWarehouseModalOpen(false);
    setLocatorModalOpen(true);
  };

  const handleAddWarehouse = (formData) => {
    const { warehouse_ID, warehouse } = formData;

    fetch("/api/insertWarehouse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ warehouse_ID, warehouse }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLocatorData((prev) => [...prev, data]);
      });
  };

  const openWarehouseModal = () => {
    setLocatorModalOpen(false);
    setWarehouseModalOpen(true);
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
        <h1>Warehousing Master Data</h1>
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={openLocatorModal}>
            Add New Locator
          </button>
          <button className={styles.button} onClick={openWarehouseModal}>
            Add New Warehouse
          </button>
        </div>

        <div className={styles.tablesContainer}>
          <div className={styles.locatorTable}>
            <h2>Locator Master Data</h2>
            <DataTable data={locatorData} columns={locatorColumns} />
          </div>
          <div className={styles.warehouseTable}>
            <h2>Warehouse Master Data</h2>
            <DataTable data={warehouseData} columns={warehouseColumns} />
          </div>
        </div>
      </div>
      {/* Modal for adding new locator */}
      <DataModal
        isOpen={isLocatorModalOpen}
        onClose={() => setLocatorModalOpen(false)}
        onSubmit={handleAddLocator}
        fields={locatorColumns}
      />
      {/* Modal for adding new warehouse */}
      <DataModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setWarehouseModalOpen(false)}
        onSubmit={handleAddWarehouse}
        fields={warehouseColumns}
      />
    </div>
  );
}
