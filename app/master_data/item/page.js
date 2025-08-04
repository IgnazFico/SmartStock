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

  const [itemMasterData, setItemMasterData] = useState([]);
  const [materialData, setMaterialData] = useState([]);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isMaterialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState({}); // { material_ID: value }

  const itemMasterColumns = [
    { key: "item_id", label: "Part Number" },
    { key: "toy_number", label: "Toy Number" },
    { key: "description", label: "Description" },
  ];

  const materialColumns = [
    { key: "material_ID", label: "Part Number" },
    { key: "material", label: "Material" },
    { key: "description", label: "Description" },
    { key: "cost", label: "Cost" },
    { key: "unit", label: "Unit" },
    { key: "lead_time", label: "Lead Time" },
    { key: "threshold", label: "Threshold" },
  ];

  useEffect(() => {
    const fetchItemMaster = async () => {
      const response = await fetch("/api/itemMaster");
      const data = await response.json();
      setItemMasterData(data);
    };
    const fetchMaterial = async () => {
      const response = await fetch("/api/getMaterials");
      const data = await response.json();
      setMaterialData(data);
    };

    fetchItemMaster();
    fetchMaterial();

    const interval = setInterval(() => {
      fetchItemMaster();
      fetchMaterial();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleAddItem = (formData) => {
    const { item_id, toy_number, description } = formData;
    fetch("/api/insertItem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id, toy_number, description }),
    })
      .then((res) => res.json())
      .then((data) => {
        setItemMasterData((prev) => [...prev, data]);
      });
  };

  const handleAddMaterial = (formData) => {
    fetch("/api/insertMaterial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        setMaterialData((prev) => [...prev, data]);
      });
  };

  const handleEditThreshold = (material_ID, value) => {
    setEditingThreshold((prev) => ({ ...prev, [material_ID]: value }));
  };

  const handleSaveThreshold = (material_ID) => {
    const newValue = editingThreshold[material_ID];
    fetch(`/api/updateMaterialThreshold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material_ID, threshold: newValue }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMaterialData((prev) =>
          prev.map((mat) =>
            mat.material_ID === material_ID
              ? { ...mat, threshold: newValue }
              : mat
          )
        );
        setEditingThreshold((prev) => {
          const copy = { ...prev };
          delete copy[material_ID];
          return copy;
        });
      });
  };

  const openItemModal = () => {
    setItemModalOpen(true);
  };

  const openMaterialModal = () => {
    setMaterialModalOpen(true);
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
        <h1>Items & Materials Master Data</h1>
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={openItemModal}>
            Add New Item
          </button>
          <button className={styles.button} onClick={openMaterialModal}>
            Add New Material
          </button>
        </div>

        <div className={styles.tablesContainer}>
          <div className={styles.itemsTable}>
            <h2>Item Master Data</h2>
            <DataTable data={itemMasterData} columns={itemMasterColumns} />
          </div>
          <div className={styles.itemsTable}>
            <h2>Material Master Data</h2>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  {materialColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {materialData.map((row) => (
                  <tr key={row.material_ID}>
                    {materialColumns.map((col) => (
                      <td key={col.key}>
                        {col.key === "threshold" &&
                        editingThreshold[row.material_ID] !== undefined ? (
                          <>
                            <input
                              type="number"
                              value={editingThreshold[row.material_ID]}
                              onChange={(e) =>
                                handleEditThreshold(
                                  row.material_ID,
                                  e.target.value
                                )
                              }
                              style={{ width: "70px" }}
                            />
                            <button
                              onClick={() =>
                                handleSaveThreshold(row.material_ID)
                              }
                              style={{ marginLeft: 4 }}
                            >
                              Save
                            </button>
                          </>
                        ) : col.key === "threshold" ? (
                          <>{row[col.key]}</>
                        ) : (
                          row[col.key]
                        )}
                      </td>
                    ))}
                    <td>
                      {editingThreshold[row.material_ID] === undefined ? (
                        <button
                          onClick={() =>
                            handleEditThreshold(
                              row.material_ID,
                              row.threshold || 0
                            )
                          }
                        >
                          Edit
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal for adding new item */}
      <DataModal
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSubmit={handleAddItem}
        fields={itemMasterColumns.map((col) => col.key)}
      />
      {/* Modal for adding new material */}
      <DataModal
        isOpen={isMaterialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        onSubmit={handleAddMaterial}
        fields={materialColumns.map((col) => col.key)}
      />
    </div>
  );
}
