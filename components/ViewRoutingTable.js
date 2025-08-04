"use client";
import { useEffect, useState } from "react";
import DataModal from "./DataModal";
import { useRouter } from "next/navigation";
import styles from "./ViewRoutingTable.module.css";

export default function ViewRoutingTable() {
  const [routings, setRoutings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routingCode, setRoutingCode] = useState("");
  const [availableRoutings, setAvailableRoutings] = useState([]);
  const router = useRouter();
  const [isOperationModalOpen, setOperationModalOpen] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);
  // Add new operation
  const handleAddOperation = async (formData) => {
    setOperationLoading(true);
    setOperationError(null);
    try {
      // Get the latest operation_id
      const res = await fetch("/api/getOperations");
      const data = await res.json();
      let maxId = 0;
      data.forEach((op) => {
        const num = parseInt((op.operation_id || "").replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      });
      const nextId = (maxId + 1).toString().padStart(5, "0");
      const operation_id = nextId;
      // Insert new operation
      const insertRes = await fetch("/api/insertOperation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, operation_id }),
      });
      if (!insertRes.ok) throw new Error("Failed to insert operation");
      setOperationModalOpen(false);
      alert("Operation added!");
    } catch (err) {
      setOperationError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  useEffect(() => {
    async function fetchRoutingCodes() {
      try {
        const res = await fetch("/api/getRoutings");
        const data = await res.json();
        setAvailableRoutings(data.map((r) => r.process_id));
      } catch (err) {
        console.error(err);
      }
    }
    fetchRoutingCodes();
  }, []);

  const fetchRoutingDetails = async () => {
    if (!routingCode) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/getRoutings?process_id=${routingCode}`);
      if (!res.ok) throw new Error("Failed to fetch routing details");
      const data = await res.json();
      setRoutings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>View Routing</h2>

      {/* Routing Selector */}
      <div className={styles.selector}>
        <label>Select Routing Code: </label>
        <select
          value={routingCode}
          onChange={(e) => setRoutingCode(e.target.value)}
        >
          <option value="">-- Select Routing --</option>
          {availableRoutings.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <button onClick={fetchRoutingDetails} disabled={!routingCode}>
          Load Routing
        </button>
        <button onClick={() => router.push("/master_data/create-routing")}>
          ➕ Create Routing
        </button>
        <button onClick={() => setOperationModalOpen(true)}>
          ➕ Add Operation
        </button>
        {/* Modal for adding new operation */}
        <DataModal
          isOpen={isOperationModalOpen}
          onClose={() => setOperationModalOpen(false)}
          onSubmit={handleAddOperation}
          fields={["machine_code", "work_center", "description"]}
          loading={operationLoading}
          error={operationError}
          title="Add New Operation"
        />
      </div>

      {loading && <p>Loading routing details...</p>}
      {error && <p className={styles.error}>Error: {error}</p>}

      {!loading && !error && routings.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Routing ID</th>
              <th>Part Number</th>
              <th>Process Name</th>
              <th>Operations</th>
            </tr>
          </thead>
          <tbody>
            {routings.map((routing) => (
              <tr key={routing._id || routing.process_id}>
                <td>{routing.process_id}</td>
                <td>{routing.item_id}</td>
                <td>{routing.process_name}</td>
                <td>
                  {routing.operations.map((op, idx) => (
                    <div key={idx} className={styles.operationBlock}>
                      <div>
                        <b>Code:</b> {op.machine_code}
                      </div>
                      <div>
                        <b>Machine:</b>{" "}
                        {op.machineCode || op.description || "N/A"}
                      </div>
                      <div>
                        <b>Components:</b>{" "}
                        {op.components && op.components.length > 0
                          ? op.components.join(", ")
                          : "-"}
                      </div>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
