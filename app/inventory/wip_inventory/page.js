"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";

const WIPTable = React.lazy(() => import("../../../components/WIPTable"));

function generateRandomNumber() {
  return Math.floor(1000 + Math.random() * 9000);
}

const WIPInventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWip, setNewWip] = useState({
    wip_ID: "",
    warehouse_ID: "",
    part_number: "",
    quantity: "",
    locator: "",
    process_ID: "",
  });

  const { data: session, status } = useSession();
  const loading = status === "loading";
  const role = session?.user?.role;
  const router = useRouter();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch("/api/getWIPInventory", {
          next: { revalidate: 0 },
          cache: "no-store",
        });
        const data = await response.json();
        setRecords(data || []);
        setFilteredRecords(data || []);
      } catch (error) {
        console.error("Error fetching WIP records:", error);
      }
    };

    fetchRecords();
  }, []);

  useEffect(() => {
    if (showAddForm) {
      setNewWip({
        wip_ID: "WIP_" + generateRandomNumber(),
        warehouse_ID: "PRD-" + generateRandomNumber(),
        prod_order_id: "",
        quantity: "",
        locator: "",
        timesubmitted: "",
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
           (record.part_number?.toLowerCase() || "").includes(term.toLowerCase()) ||
            (record.locator?.toLowerCase() || "").includes(term.toLowerCase())
            );
              setFilteredRecords(filtered);
      }
    }, 500),
    [records]
  );

  useEffect(() => {
  handleSearchChange(searchTerm);
}, [searchTerm, records]);

  if (loading) return <p>Loading...</p>;

  if (!session) {
    router.push("/auth");
    return null;
  }

  const totalQuantity = filteredRecords.reduce(
    (sum, record) => sum + Number(record.quantity),
    0
  );

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/addWIPInventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWip,
          quantity: Number(newWip.quantity),
        }),
      });
      if (!res.ok) throw new Error("Failed to add WIP Inventory");
      const data = await res.json();

      setRecords((prev) => [...prev, data]);
      setFilteredRecords((prev) => [...prev, data]);
      setShowAddForm(false);
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
      }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>WIP Inventory</h2>

      {(role === "super" || role === "admin") && (
        <div style={{ marginBottom: "20px" }}>
          <button
            className={styles.buttonAnimate}
            onClick={() => setShowAddForm(true)}
          >
            ➕ WIP Inventory
          </button>
        </div>
      )}

      {showAddForm && (
        <div className={styles.overlayForm}>
          <div className={styles.formContainer}>
            <h3>Add WIP Item</h3>
            <form onSubmit={handleAddSubmit}>
              <div className={styles.gridForm}>
                <div>
                  <label>WIP ID</label>
                  <input type="text" value={newWip.wip_ID} disabled readOnly />
                </div>
                <div>
                  <label>Warehouse ID</label>
                  <input
                    type="text"
                    value={newWip.warehouse_ID}
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <label>prod_order_id</label>
                  <input
                    type="text"
                    value={newWip.prod_order_id}
                    onChange={(e) =>
                      setNewWip((prev) => ({
                        ...prev,
                        prod_order_id: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={newWip.quantity}
                    onChange={(e) =>
                      setNewWip((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label>Locator</label>
                  <input
                    type="text"
                    value={newWip.locator}
                    onChange={(e) =>
                      setNewWip((prev) => ({
                        ...prev,
                        locator: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                  <div>
                </div>
              </div>
              <div className={styles.formButtons}>
                <button type="submit" className={styles.buttonAnimate}>
                  Submit
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        </div>
        <div style={{ textAlign: "right" }}>
          <h3>Results</h3>
          <p>
            {filteredRecords.length} records | Total Quantity: {totalQuantity}
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading table...</div>}>
        <WIPTable records={filteredRecords} />
      </Suspense>
    </div>
  );
};

export default WIPInventoryPage;
