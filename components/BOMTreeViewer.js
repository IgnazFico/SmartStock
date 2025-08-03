"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./BOMTreeViewer.module.css";

export default function BOMTreeViewer() {
  const [mainItem, setMainItem] = useState("");
  const [availableItems, setAvailableItems] = useState([]);
  const [bomTree, setBOMTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/itemMaster")
      .then((res) => res.json())
      .then(setAvailableItems)
      .catch(console.error);
  }, []);

  const fetchBOM = async () => {
    if (!mainItem) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bomTree?item=${mainItem}`);
      const data = await res.json();
      setBOMTree(data);
    } catch (err) {
      console.error("Error fetching BOM:", err);
    } finally {
      setLoading(false);
    }
  };

  // Recursive function to render BOM tree
  const renderBOMNode = (node) => {
    return (
      <li key={node.component_item_id}>
        <div className={styles.node}>
          <strong>{node.component_item_id}</strong> - {node.quantity}{" "}
          {node.unit}
        </div>
        {node.subcomponents && node.subcomponents.length > 0 && (
          <ul className={styles.childList}>
            {node.subcomponents.map((sub) => renderBOMNode(sub))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>BOM Tree Viewer</h2>

      <div className={styles.selector}>
        <label htmlFor="mainItem">Select Main Item:</label>
        <select
          id="mainItem"
          value={mainItem}
          onChange={(e) => setMainItem(e.target.value)}
        >
          <option value="">-- Select Item --</option>
          {availableItems.map((item) => (
            <option key={item.item_id} value={item.item_id}>
              {item.item_id} - {item.description}
            </option>
          ))}
        </select>
        <button onClick={fetchBOM} disabled={!mainItem}>
          Load BOM
        </button>
        <button
          type="button"
          onClick={() => router.push("/create-bom")}
          className={styles.createButton}
        >
          ➕ Create BOM
        </button>
      </div>

      {loading && <p>Loading BOM...</p>}

      {bomTree && bomTree.length && (
        <div className={styles.treeContainer}>
          <h3>BOM for: {mainItem}</h3>
          <ul className={styles.tree}>
            {bomTree.map((node) => renderBOMNode(node))}
          </ul>
        </div>
      )}
    </div>
  );
}
