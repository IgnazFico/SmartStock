"use client";

import { useState, useEffect } from "react";
import styles from "./CreateRoutingForm.module.css";

export default function CreateRoutingForm() {
  const [itemID, setItemID] = useState("");
  const [routingID, setRoutingID] = useState("");
  const [processName, setProcessName] = useState("");
  const [operations, setOperations] = useState([]);
  const [processes, setProcesses] = useState([
    {
      operation: 10,
      machineCode: "",
      workCenter: "",
      machineName: "",
      components: [""],
    },
  ]);
  const [itemOptions, setItemOptions] = useState([]);

  // Fetch operations (machines) and item master (components)
  useEffect(() => {
    async function fetchOperations() {
      const res = await fetch("/api/getOperations");
      const data = await res.json();
      setOperations(data);
    }
    async function fetchItems() {
      const [itemRes, matRes] = await Promise.all([
        fetch("/api/itemMaster"),
        fetch("/api/getMaterials"),
      ]);
      const items = await itemRes.json();
      const mats = await matRes.json();
      setItemOptions({ items, mats });
    }
    fetchOperations();
    fetchItems();
  }, []);

  const addProcess = () => {
    const lastOp = processes[processes.length - 1]?.operation || 0;
    setProcesses([
      ...processes,
      {
        operation: lastOp + 10,
        machineCode: "",
        workCenter: "",
        machineName: "",
        components: [""],
      },
    ]);
  };

  const handleProcessChange = (index, field, value) => {
    const updated = [...processes];
    updated[index][field] = value;
    setProcesses(updated);
  };

  const handleMachineSelect = (index, selectedCode) => {
    const selectedMachine = operations.find(
      (op) => op.machine_code === selectedCode
    );
    const updated = [...processes];
    updated[index].machineCode = selectedCode;
    updated[index].workCenter = selectedMachine?.work_center || "";
    updated[index].machineName = selectedMachine?.description || "";
    setProcesses(updated);
  };

  // Update a component_id string in the array
  const handleMaterialChange = (pIndex, mIndex, value) => {
    const updated = [...processes];
    updated[pIndex].components[mIndex] = value;
    setProcesses(updated);
  };

  const addMaterial = (pIndex) => {
    const updated = [...processes];
    updated[pIndex].components.push("");
    setProcesses(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      itemID,
      process_id: routingID,
      process_name: processName,
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
          <label>Part Number</label>
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
      </div>

      <table className={styles.routingTable}>
        <thead>
          <tr>
            <th>Operation</th>
            <th>Machine Code</th>
            <th>Work Center</th>
            <th>Machine Name</th>
            <th>Component</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((proc, pIdx) => (
            <tr key={pIdx}>
              <td>
                <input type="number" value={proc.operation} readOnly />
              </td>
              <td>
                <select
                  value={proc.machineCode}
                  onChange={(e) => handleMachineSelect(pIdx, e.target.value)}
                >
                  <option value="">-- Select Machine --</option>
                  {operations.map((op) => (
                    <option key={op._id} value={op.machine_code}>
                      {op.machine_code}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input type="text" value={proc.workCenter} readOnly />
              </td>
              <td>
                <input type="text" value={proc.machineName} readOnly />
              </td>
              <td>
                {proc.components.map((componentId, mIdx) => (
                  <div key={mIdx} className={styles.materialRow}>
                    <select
                      value={componentId}
                      onChange={(e) =>
                        handleMaterialChange(pIdx, mIdx, e.target.value)
                      }
                    >
                      <option value="">-- Select Component --</option>
                      {itemOptions.items && itemOptions.items.length > 0 && (
                        <optgroup label="Items">
                          {itemOptions.items.map((item) => (
                            <option key={item.item_id} value={item.item_id}>
                              {item.item_id} {item.description ? `- ${item.description}` : ""}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {itemOptions.mats && itemOptions.mats.length > 0 && (
                        <optgroup label="Materials">
                          {itemOptions.mats.map((mat) => (
                            <option key={mat.material_ID} value={mat.material_ID}>
                              {mat.material_ID} {mat.description ? `- ${mat.description}` : ""}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
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
