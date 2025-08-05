"use client";

import { useState, useEffect } from "react";
import styles from "./CreateBOMForm.module.css"; // Import module CSS

export default function CreateBOMForm() {
  const [mainItem, setMainItem] = useState("");
  const [mainItemOptions, setMainItemOptions] = useState([]);
  const [components, setComponents] = useState([
    { item: "", quantity: "", unit: "", subcomponents: [] },
  ]);

  const [itemOptions, setItemOptions] = useState([]);

  useEffect(() => {
    async function fetchOptions() {
      const [itemRes, matRes] = await Promise.all([
        fetch("/api/itemMaster"),
        fetch("/api/getMaterials"),
      ]);
      const items = await itemRes.json();
      const mats = await matRes.json();
      // For main item selection (only items)
      setMainItemOptions(
        items.map((i) => ({
          value: i.item_id,
          label: i.item_id + (i.description ? ` - ${i.description}` : ""),
        }))
      );
      // For component selection (items and materials)
      const all = [
        ...items.map((i) => ({
          value: i.item_id,
          label: i.item_id + (i.description ? ` - ${i.description}` : ""),
          type: "item",
        })),
        ...mats.map((m) => ({
          value: m.material_ID,
          label: m.material_ID + (m.description ? ` - ${m.description}` : ""),
          type: "material",
          unit: m.unit || "",
        })),
      ];
      setItemOptions(all);
    }
    fetchOptions();
  }, []);

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

  // Remove a root-level component
  const removeComponent = (index) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove a subcomponent at a given path
  const removeSubcomponentAtPath = (prev, path) => {
    const updated = structuredClone(prev);
    let ref = updated;
    for (let i = 0; i < path.length - 1; i++) {
      ref = ref[path[i]].subcomponents;
    }
    ref.splice(path[path.length - 1], 1);
    return updated;
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
      if (field === "item") {
        // Find the selected option
        const selected = itemOptions.find((opt) => opt.value === value);
        if (selected && selected.type === "material" && selected.unit) {
          // Autofill unit
          parentSetter((prev) => {
            let updated = updateNestedComponent(prev, path, "item", value);
            updated = updateNestedComponent(
              updated,
              path,
              "unit",
              selected.unit
            );
            return updated;
          });
        } else {
          // Clear unit
          parentSetter((prev) => {
            let updated = updateNestedComponent(prev, path, "item", value);
            updated = updateNestedComponent(updated, path, "unit", "");
            return updated;
          });
        }
      } else {
        parentSetter((prev) => updateNestedComponent(prev, path, field, value));
      }
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
          <select
            value={comp.item}
            onChange={(e) => updateComponent("item", e.target.value)}
            required
            className={styles.inputField}
          >
            <option value="">-- Select Item/Material --</option>
            {itemOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.addSub} onClick={addSub}>
              + Add Subcomponent
            </button>
            {isRoot && components.length > 1 ? (
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeComponent(path[0])}
                title="Remove Component"
              >
                &minus;
              </button>
            ) : !isRoot ? (
              <button
                type="button"
                className={styles.removeButton}
                onClick={() =>
                  parentSetter((prev) => removeSubcomponentAtPath(prev, path))
                }
                title="Remove Subcomponent"
              >
                &minus;
              </button>
            ) : null}
          </div>
        </div>

        {/* Render Subcomponents recursively */}
        {Array.isArray(comp.subcomponents) && comp.subcomponents.length > 0 && (
          <div className={styles.subcomponent}>
            {comp.subcomponents.map((sub, subIdx) =>
              renderComponentForm(sub, [...path, subIdx], parentSetter)
            )}
          </div>
        )}
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
        <select
          value={mainItem}
          onChange={(e) => setMainItem(e.target.value)}
          className={styles.inputField}
          required
        >
          <option value="">-- Select Main Item --</option>
          {mainItemOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
