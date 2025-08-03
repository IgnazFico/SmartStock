"use client";

import { useState } from "react";
import styles from "./CreateBOMForm.module.css"; // Import module CSS

export default function CreateBOMForm() {
  const [mainItem, setMainItem] = useState("");
  const [components, setComponents] = useState([
    { item: "", quantity: "", unit: "", subcomponents: [] },
  ]);

  const handleComponentChange = (listSetter, index, field, value) => {
    listSetter((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addComponent = (listSetter) => {
    listSetter((prev) => [
      ...prev,
      { item: "", quantity: "", unit: "", subcomponents: [] },
    ]);
  };

  const addSubcomponentAtPath = (prev, path) => {
    const updated = structuredClone(prev);
    let ref = updated;
    for (let i = 0; i < path.length; i++) {
      ref = ref[path[i]].subcomponents;
    }
    ref.push({ item: "", quantity: "", unit: "", subcomponents: [] });
    return updated;
  };

  const updateNestedComponent = (prev, path, field, value) => {
    const updated = structuredClone(prev);
    let ref = updated;
    for (let i = 0; i < path.length - 1; i++) {
      ref = ref[path[i]].subcomponents;
    }
    const last = path[path.length - 1];
    ref[last] = { ...ref[last], [field]: value };
    return updated;
  };

  const renderComponentForm = (comp, path, parentSetter, isRoot = false) => {
    const updateComponent = (field, value) => {
      parentSetter((prev) => updateNestedComponent(prev, path, field, value));
    };

    const addSub = () => {
      parentSetter((prev) => addSubcomponentAtPath(prev, path));
    };

    return (
      <div
        key={path.join("-")}
        className={`${styles.componentBlock} ${isRoot ? styles.root : ""}`}
      >
        <div className={styles.componentGrid}>
          <input
            type="text"
            placeholder="Item"
            value={comp.item}
            onChange={(e) => updateComponent("item", e.target.value)}
            required
            className={styles.inputField}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={comp.quantity}
            onChange={(e) => updateComponent("quantity", e.target.value)}
            required
            className={styles.inputField}
          />
          <input
            type="text"
            placeholder="Unit"
            value={comp.unit}
            onChange={(e) => updateComponent("unit", e.target.value)}
            className={styles.inputField}
          />
        </div>

        {/* Render Subcomponents recursively */}
        {Array.isArray(comp.subcomponents) && comp.subcomponents.length > 0 && (
          <div className={styles.subcomponent}>
            {comp.subcomponents.map((sub, subIdx) =>
              renderComponentForm(sub, [...path, subIdx], parentSetter)
            )}
          </div>
        )}

        <button type="button" className={styles.addSub} onClick={addSub}>
          + Add Subcomponent
        </button>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { mainItem, components };
    const res = await fetch("/api/bom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "BOM saved.");
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <div>
        <label className={styles.label}>Main Item</label>
        <input
          type="text"
          value={mainItem}
          onChange={(e) => setMainItem(e.target.value)}
          className={styles.inputField}
          required
        />
      </div>

      <h2 className={styles.sectionTitle}>Component Items</h2>
      <div className={styles.bomTree}>
        {components.map((comp, idx) =>
          renderComponentForm(comp, [idx], setComponents, true)
        )}
      </div>

      <button
        type="button"
        onClick={() => addComponent(setComponents)}
        className={styles.addComponent}
      >
        + Add Component
      </button>

      <div>
        <button type="submit" className={styles.saveButton}>
          Save BOM
        </button>
      </div>
    </form>
  );
}
