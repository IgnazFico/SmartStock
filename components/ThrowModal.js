import React, { useState } from "react";

// Memoized ThrowModal to prevent unnecessary re-renders
const ThrowModal = React.memo(({ selectedRecord, onClose, onSubmit }) => {
  const [quantityToThrow, setQuantityToThrow] = useState(0); // Track user input for throw quantity

  const handleSubmit = () => {
    // Validate quantity input
    if (
      !quantityToThrow ||
      quantityToThrow <= 0 ||
      quantityToThrow > selectedRecord.quantity // gunakan field quantity
    ) {
      alert("Invalid quantity");
      return;
    }

    onSubmit(quantityToThrow);
    setQuantityToThrow(0);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#edededf0",
        padding: "20px",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        borderRadius: "15px",
      }}
    >
      <h3>Throw Item</h3>
      <p>
        Part Number: {selectedRecord.part_number} | Locator: {selectedRecord.locator}
      </p>
      <input
        type="number"
        placeholder="Enter Quantity to Throw"
        min="1"
        max={selectedRecord.quantity}
        value={quantityToThrow}
        onChange={(e) => setQuantityToThrow(parseInt(e.target.value, 10))}
        style={{ padding: "10px", width: "90%" }}
      />
      <button
        onClick={handleSubmit}
        style={{
          padding: "10px",
          marginTop: "10px",
          width: "100%",
          backgroundColor: "#074d6f",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Submit
      </button>
      <button
        onClick={onClose}
        style={{
          padding: "10px",
          marginTop: "10px",
          width: "100%",
          backgroundColor: "#6F2907",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
});

export default ThrowModal;
