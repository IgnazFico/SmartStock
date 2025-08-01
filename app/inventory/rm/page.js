"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";
import * as XLSX from "xlsx";

const InvTable = React.lazy(() => import("../../../components/InvRawMaterialTable"));

// Fungsi generate random number 4 digit (1000-9999)
function generateRandomNumber() {
  return Math.floor(1000 + Math.random() * 9000);
}

const RawMaterialPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    rm_ID: "",
    warehouse_ID: "",
    part_number: "",
    quantity: "",
    locator: "",
    po_ID: "",
  });

  const { data: session, status } = useSession();
  const loading = status === "loading";
  const role = session?.user?.role;
  const router = useRouter();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch("/api/getRawMaterialRecords", {
          next: { revalidate: 0 },
          cache: "no-store",
        });
        const data = await response.json();
        setRecords(data || []);
        setFilteredRecords(data || []);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };

    fetchRecords();
  }, []);
  const handleExportFromServer = async () => {
  try {
    const response = await fetch("/api/exportInventoryRm");
    const data = await response.json();

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory RM");

    XLSX.writeFile(wb, "inventoryRM_export.xlsx");
  } catch (error) {
    console.error("Export error:", error);
  }
};


  // Generate rm_ID & warehouse_ID tiap kali form dibuka
  useEffect(() => {
    if (showAddForm) {
      const newRmId = "INV_" + generateRandomNumber() + "RM";
      const newWarehouseId = "WH-" + generateRandomNumber();
      setNewMaterial({
        rm_ID: newRmId,
        warehouse_ID: newWarehouseId,
        part_number: "",
        quantity: "",
        locator: "",
        po_ID: "",
      });
    }
  }, [showAddForm]);

  const handleSearchChange = useCallback(
    debounce((term) => {
      if (term === "") {
        setFilteredRecords(records);
      } else {
        const filtered = records.filter(
          (record) =>
            record.part_number.toLowerCase().includes(term.toLowerCase()) ||
            record.locator.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredRecords(filtered);
      }
    }, 500),
    [records]
  );


  if (loading) return <p>Loading...</p>;

  if (!session) {
    router.push("/auth");
    return null;
  }

  const onSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
    handleSearchChange(event.target.value);
  };

  const totalQuantity = filteredRecords.reduce(
    (sum, record) => sum + Number(record.quantity),
    0
  );

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/addRawMaterial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMaterial,
          quantity: Number(newMaterial.quantity),
        }),
      });
      if (!res.ok) throw new Error("Failed to add raw material");
      const data = await res.json();

      setRecords((prev) => [...prev, data]);
      setFilteredRecords((prev) => [...prev, data]);
      setShowAddForm(false);
      setNewMaterial({
        rm_ID: "",
        warehouse_ID: "",
        part_number: "",
        quantity: "",
        locator: "",
        po_ID: "",
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#EDEDEDF0",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
        Raw Material Inventory
      </h2>

      <div className="flex justify-between items-center mb-4">
        <div>
          <input
            type="text"
            placeholder="Search by Part Number or Locator"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px", width: "300px" }}
          />
          <button
            className={styles.buttonAnimate}
            onClick={() => handleSearchChange(searchTerm)}
          >
            Search
          </button>
           <button
              className={styles.buttonAnimate}
              onClick={handleExportFromServer}
            >
              Export to Excel
          </button>
        </div>
        <div style={{ textAlign: "right" }}>
          <h3>Results</h3>
          <p>
            {filteredRecords.length} records | Total Quantity: {totalQuantity}
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading table...</div>}>
        <InvTable records={filteredRecords} />
      </Suspense>
    </div>
  );
};

export default RawMaterialPage;
