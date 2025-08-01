"use client";

import React, { useState, useEffect } from "react";
import styles from "./ReceivingTable.module.css";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ReceivingTable = ({ records = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [poItems, setPoItems] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const { data: session } = useSession();

  const [receivedQuantities, setReceivedQuantities] = useState({});

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/receiving");
      const data = await res.json();
      setAllRecords(data);
    } catch (error) {
      console.error("Gagal fetch data PO:", error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const recordsPerPage = 10;

  // Fetch suppliers and materials once
  useEffect(() => {
    async function fetchSuppliersAndMaterials() {
      try {
        const [supRes, matRes] = await Promise.all([
          fetch("/api/supplier"),
          fetch("/api/materials"),
        ]);
        const [supData, matData] = await Promise.all([
          supRes.json(),
          matRes.json(),
        ]);
        setSuppliers(supData);
        setMaterials(matData);
      } catch (error) {
        console.error("Gagal ambil data supplier/material:", error);
      }
    }
    fetchSuppliersAndMaterials();
  }, []);

  // Fetch PO items ketika selectedRecord berubah
  useEffect(() => {
    async function fetchPOItems() {
      if (!selectedRecord) return;
      try {
        const res = await fetch(`/api/po-items?po_ID=${selectedRecord.po_ID}`);
        if (!res.ok) throw new Error("Gagal ambil PO items");
        const data = await res.json();
        setPoItems(data);

        // Reset inputan qty saat buka modal baru
        const initialQuantities = {};
        data.forEach((item) => {
          initialQuantities[item.material_ID] = "";
        });
        setReceivedQuantities(initialQuantities);
      } catch (error) {
        console.error("Gagal fetch PO Items:", error);
        setPoItems([]);
      }
    }
    fetchPOItems();
  }, [selectedRecord]);

  const filteredRecords = Array.isArray(allRecords)
    ? allRecords
        .filter((r) =>
          [r.po_ID, r.supplier_ID, r.material_ID].some((field) =>
            (field ?? "").toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
        .filter((r) =>
          statusFilter === "All"
            ? true
            : r.status.toLowerCase() === statusFilter.toLowerCase()
        )
    : [];

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);

  const paginate = (page) => setCurrentPage(page);

  const handleQtyChange = (material_ID, value) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [material_ID]: Number(value),
    }));
  };

  const handleReceive = async () => {
    if (!selectedRecord) return;

    // Validasi qty
    for (const item of poItems) {
      const inputQty = receivedQuantities[item.material_ID] || 0;
      const maxQty = item.quantity - (item.received_qty || 0);

      if (inputQty > maxQty) {
        alert(
          `Qty for ${item.material_ID} exceeds the remaining order. Maximum:${maxQty}`
        );
        return;
      }
    }

    const itemsPayload = Object.entries(receivedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([material_ID, qty]) => ({ material_ID, qty }));

    if (itemsPayload.length === 0) {
      alert("Fill in the number of items received first.");
      return;
    }

    const payload = {
      po_ID: selectedRecord.po_ID,
      received_date: new Date().toISOString(),
      items: itemsPayload,
    };

    const response = await fetch(`/api/receiving`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      fetchRecords();
      setSelectedRecord(null);
    }
  };

  const getSupplierName = (supplier_ID) => {
    const supplier = suppliers.find((s) => s.supplier_ID === supplier_ID);
    return supplier ? supplier.supplier : "-";
  };

  const getMaterialName = (material_ID) => {
    const material = materials.find((m) => m.material_ID === material_ID);
    return material ? material.material : "-";
  };

  /** EXPORT TO EXCEL FUNCTION */
  const exportToExcel = async () => {
    if (filteredRecords.length === 0) {
      alert("No data for export");
      return;
    }

    try {
      // Ambil semua PO items
      const itemsRes = await fetch("/api/po-items");
      if (!itemsRes.ok) throw new Error("Gagal ambil PO Items");
      const allItems = await itemsRes.json();

      // Gabungkan Receiving dengan itemnya
      const exportData = [];
      for (const rec of filteredRecords) {
        const relatedItems = allItems.filter(
          (item) => item.po_ID === rec.po_ID
        );

        if (relatedItems.length > 0) {
          relatedItems.forEach((item) => {
            exportData.push({
              "PO ID": rec.po_ID,
              "Order Date": rec.order_date
                ? new Date(rec.order_date).toISOString().split("T")[0]
                : "",
              "Received Date": rec.received_date
                ? new Date(rec.received_date).toISOString().split("T")[0]
                : "",
              Status: rec.status,
              Supplier: getSupplierName(rec.supplier_ID),
              "Material ID": item.material_ID,
              Material: getMaterialName(item.material_ID),
              "Ordered Qty": item.quantity,
              "Received Qty": item.received_qty || 0,
            });
          });
        } else {
          exportData.push({
            "PO ID": rec.po_ID,
            "Order Date": rec.order_date
              ? new Date(rec.order_date).toISOString().split("T")[0]
              : "",
            "Received Date": rec.received_date
              ? new Date(rec.received_date).toISOString().split("T")[0]
              : "",
            Status: rec.status,
            Supplier: getSupplierName(rec.supplier_ID),
            "Material ID": "-",
            Material: "-",
            "Ordered Qty": 0,
            "Received Qty": 0,
          });
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Receiving");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `receiving_${Date.now()}.xlsx`);
    } catch (error) {
      console.error("Export to Excel gagal:", error);
      alert("Fail export data Receiving");
    }
  };

  return (
    <div>
      <div className={styles.actions}>
        <div className={styles.searchAndFilterGroup}>
          <input
            type="text"
            placeholder="Search PO Number, Supplier, or Part..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
          <select
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="All">All</option>
            <option value="Received">Received</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Ordered">Ordered</option>
          </select>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <p>Tidak ada data Purchase Order.</p>
      ) : (
        <>
          <div className={styles.resultsBar}>
            <div className={styles.resultsSummary}>
              {filteredRecords.length} records
            </div>
            <button onClick={exportToExcel} className={styles.exportButton}>
              Export to Excel
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th>PO ID</th>
                <th>Order Date</th>
                <th>Received Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((r, i) => (
                <tr key={i} onClick={() => setSelectedRecord(r)}>
                  <td>{r.po_ID}</td>
                  <td>{r.order_date}</td>
                  <td>{r.received_date}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.container}>
            {Array.from(
              { length: Math.ceil(filteredRecords.length / recordsPerPage) },
              (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={styles.pageButton}
                >
                  {i + 1}
                </button>
              )
            )}
          </div>
        </>
      )}

      {selectedRecord && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Detail PO: {selectedRecord.po_ID}</h3>
            <div className={styles.detailInfo}>
              <p>
                <strong>Order Date:</strong> {selectedRecord.order_date}
              </p>
              <p>
                <strong>Supplier:</strong>{" "}
                {getSupplierName(selectedRecord.supplier_ID)}
              </p>
              <p>
                <strong>Status:</strong> {selectedRecord.status}
              </p>
              <p>
                <strong>Received Date:</strong> {selectedRecord.received_date}
              </p>
            </div>

            <h4>Items:</h4>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Ordered Qty</th>
                  <th>Received Qty</th>
                  {session?.user?.department === "logistics" && (
                    <th>Input Qty</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {poItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        session?.user?.department === "logistics" ? 4 : 3
                      }
                    >
                      Tidak ada item
                    </td>
                  </tr>
                ) : (
                  poItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        {item.material_ID} - {getMaterialName(item.material_ID)}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{item.received_qty || 0}</td>
                      {session?.user?.department === "logistics" && (
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity - (item.received_qty || 0)}
                            value={receivedQuantities[item.material_ID] || ""}
                            onChange={(e) =>
                              handleQtyChange(item.material_ID, e.target.value)
                            }
                            className={styles.qtyInput}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {session?.user?.department === "logistics" &&
              (selectedRecord.status === "Ordered" ||
                selectedRecord.status === "Partially Received") && (
                <button
                  onClick={handleReceive}
                  className={styles.receiveButton}
                >
                  Receive
                </button>
              )}

            <button
              onClick={() => setSelectedRecord(null)}
              className={styles.closeButton}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivingTable;
