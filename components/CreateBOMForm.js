"use client";

import { useState } from "react";

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

  const addSubcomponent = (parentIndex) => {
    setComponents((prevComponents) => {
      const updated = [...prevComponents];

      // Make a deep copy of the parent object
      const parent = { ...updated[parentIndex] };

      if (!Array.isArray(parent.subcomponents)) {
        parent.subcomponents = [];
      }

      // Immutable add
      parent.subcomponents = [
        ...parent.subcomponents,
        { item: "", quantity: "", unit: "", subcomponents: [] },
      ];

      // Update parent in the main list
      updated[parentIndex] = parent;

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      mainItem,
      components,
    };

    const res = await fetch("/api/bom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "BOM saved.");
  };

  const updateNestedComponent = (prev, path, field, value) => {
    const updated = structuredClone(prev); // safer deep copy
    let ref = updated;

    for (let i = 0; i < path.length - 1; i++) {
      ref = ref[path[i]].subcomponents;
    }

    const last = path[path.length - 1];
    ref[last] = {
      ...ref[last],
      [field]: value,
    };

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

  // Recursive render for subcomponents
  const renderComponentForm = (comp, path, parentSetter) => {
    const updateComponent = (field, value) => {
      parentSetter((prev) => updateNestedComponent(prev, path, field, value));
    };

    const addSub = () => {
      parentSetter((prev) => addSubcomponentAtPath(prev, path));
    };

    return (
      <div key={path.join("-")} className="border p-4 mb-2">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <input
            type="text"
            placeholder="Item"
            value={comp.item}
            onChange={(e) => updateComponent("item", e.target.value)}
            className="border p-2"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={comp.quantity}
            onChange={(e) => updateComponent("quantity", e.target.value)}
            className="border p-2"
            required
          />
          <input
            type="text"
            placeholder="Unit"
            value={comp.unit}
            onChange={(e) => updateComponent("unit", e.target.value)}
            className="border p-2"
          />
        </div>

        {Array.isArray(comp.subcomponents) &&
          comp.subcomponents.map((sub, subIdx) =>
            renderComponentForm(sub, [...path, subIdx], parentSetter)
          )}

        <button
          type="button"
          className="text-sm px-3 py-1 bg-purple-600 text-white rounded"
          onClick={addSub}
        >
          + Add Subcomponent
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold">Main Item</label>
        <input
          type="text"
          value={mainItem}
          onChange={(e) => setMainItem(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>

      <h2 className="font-bold">Component Items</h2>
      {components.map((comp, idx) =>
        renderComponentForm(comp, [idx], setComponents)
      )}

      <button
        type="button"
        onClick={() => addComponent(setComponents)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        + Add Component
      </button>

      <div>
        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded"
        >
          Save BOM
        </button>
      </div>
    </form>
  );
}
