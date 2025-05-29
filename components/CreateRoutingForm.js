"use client";

import { useState } from "react";
import styles from "./CreateRoutingForm.module.css";

export default function CreateRoutingForm() {
  const [itemID, setItemID] = useState("");
  const [routingID, setRoutingID] = useState("");
  const [processName, setProcessName] = useState("");
  const [wipCode, setWipCode] = useState("");
  const [processes, setProcesses] = useState([
    {
      operation: 10,
      workCenter: "",
      machineCode: "",
      machineName: "",
      materials: [{ materialID: "", quantity: 0 }],
    },
  ]);

  const addProcess = () => {
    const lastOp = processes[processes.length - 1]?.operation || 0;
    setProcesses([
      ...processes,
      {
        operation: lastOp + 10,
        workCenter: "",
        machineCode: "",
        machineName: "",
        materials: [{ materialID: "", quantity: 0 }],
      },
    ]);
  };

  const handleProcessChange = (index, field, value) => {
    const updated = [...processes];
    updated[index][field] = value;
    setProcesses(updated);
  };

  const handleMaterialChange = (pIndex, mIndex, field, value) => {
    const updated = [...processes];
    updated[pIndex].materials[mIndex][field] = value;
    setProcesses(updated);
  };

  const addMaterial = (pIndex) => {
    const updated = [...processes];
    updated[pIndex].materials.push({ materialID: "", quantity: 0 });
    setProcesses(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      itemID,
      process_id: routingID,
      process_name: processName,
      wip_code: wipCode,
      processes,
    };

    const res = await fetch("/api/itemRouting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "Routing saved.");
  };

  return (
    <form onSubmit={handleSubmit} className={styles.routingContainer}>
      <div className={styles.row}>
        <div>
          <label>Item ID</label>
          <input
            type="text"
            value={itemID}
            onChange={(e) => setItemID(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Routing ID</label>
          <input
            type="text"
            value={routingID}
            onChange={(e) => setRoutingID(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Process Name</label>
          <input
            type="text"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>WIP Code</label>
          <input
            type="text"
            value={wipCode}
            onChange={(e) => setWipCode(e.target.value)}
            required
          />
        </div>
      </div>

      <table className={styles.routingTable}>
        <thead>
          <tr>
            <th>Operation</th>
            <th>Work Center</th>
            <th>Machine Code</th>
            <th>Machine Name</th>
            <th>Materials</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((proc, pIdx) => (
            <tr key={pIdx}>
              <td>
                <input type="number" value={proc.operation} readOnly />
              </td>
              <td>
                <input
                  type="text"
                  value={proc.workCenter}
                  onChange={(e) =>
                    handleProcessChange(pIdx, "workCenter", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={proc.machineCode}
                  onChange={(e) =>
                    handleProcessChange(pIdx, "machineCode", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={proc.machineName}
                  onChange={(e) =>
                    handleProcessChange(pIdx, "machineName", e.target.value)
                  }
                />
              </td>
              <td>
                {proc.materials.map((mat, mIdx) => (
                  <div key={mIdx} className={styles.materialRow}>
                    <input
                      type="text"
                      placeholder="Material ID"
                      value={mat.materialID}
                      onChange={(e) =>
                        handleMaterialChange(
                          pIdx,
                          mIdx,
                          "materialID",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={mat.quantity}
                      onChange={(e) =>
                        handleMaterialChange(
                          pIdx,
                          mIdx,
                          "quantity",
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addMaterial(pIdx)}
                  className={styles.addMaterial}
                >
                  + Add Material
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.routingButtons}>
        <button type="button" onClick={addProcess} className={styles.addButton}>
          + Add Process
        </button>
        <button type="submit" className={styles.submitButton}>
          Save Routing
        </button>
      </div>
    </form>
  );
}
