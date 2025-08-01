"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";
import * as XLSX from "xlsx";

const InvTable = React.lazy(() => import("../../../components/InvTable"));

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch("/api/getRecords_fg", {
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
  // export to excel
  const handleExportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(filteredRecords);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory FG");
  XLSX.writeFile(workbook, "inventory_fg.xlsx");
};



  const handleSearchChange = useCallback(
    debounce((term) => {
      if (term === "") {
        setFilteredRecords(records);
      } else {
        const filtered = records.filter(
          (record) =>
            (record.part_number || "").toLowerCase().includes(term.toLowerCase()) ||
            (record.locator || "").toLowerCase().includes(term.toLowerCase())
        );
        setFilteredRecords(filtered);
      }
    }, 500),
    [records]
  );

  const { data: session, status } = useSession();
  const loading = status === "loading";
  const role = session?.user?.role;

  if (loading) {
    return <p>Loading...</p>;
  }

  const router = useRouter();

  if (!session) {
    router.push("/auth");
    return null;
  }

  const onSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const totalQuantity = filteredRecords.reduce(
    (sum, record) => sum + (record.quantity || 0),
    0
  );

  // Tidak ada handleRecordClick dan state throw

  return (
    <div      
    style={{
        position: "relative",
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#EDEDEDF0",
      }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>Finish Goods Inventory</h2>
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
            onClick={handleExportToExcel}
            style={{ padding: "10px", marginLeft: "8px" }}
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


export default InventoryPage;