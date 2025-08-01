import { useState, useCallback, useEffect } from "react";
import Select from "react-select";
import { debounce } from "lodash";
import QRCodeTemplate from "./QRCodeTemplate";
import QRCodeTemplateA4 from "./QRCodeTemplateA4";
import { createRoot } from "react-dom/client";
import styles from "./QRCodeGenerator.module.css";

const QRCodeGenerator = () => {
  const [workerBarcode, setWorkerBarcode] = useState("");
  const [isWorkerValid, setIsWorkerValid] = useState(false);
  const [Inventory_ID, setInventory_ID] = useState("");
  const [prodOptions, setProdOptions] = useState([]);
  const [prodOrderId, setProdOrderId] = useState("");
  const [part_number, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [warehouse_Id, setWarehouse_Id] = useState("wh_fg");
  const [copy, setCopy] = useState(1);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(true);

  // Fetch Inventory_ID otomatis setelah worker valid
  useEffect(() => {
    const fetchInventoryId = async () => {
      try {
        const res = await fetch("/api/generateInventoryId");
        const data = await res.json();
        setInventory_ID(data.inventoryId);
      } catch (err) {
        setInventory_ID("");
        setError("Failed to generate Inventory ID");
      }
    };
    if (isWorkerValid) {
      fetchInventoryId();
    } else {
      setInventory_ID("");
    }
  }, [isWorkerValid]);

  useEffect(() => {
    if (isWorkerValid) {
      fetch("/api/barcode/available-fg-orders")
        .then((res) => res.json())
        .then((data) => setProdOptions(data))
        .catch(() => setProdOptions([]));
    }
  }, [isWorkerValid]);
 // Fetch Production Order list (only unused)
  const prodOptionsMapped = prodOptions.map((item) => ({
    value: item.prod_order_id,
    label: item.prod_order_id,
    partNumber: item.material_ID,
    quantity: item.quantity
  }));

  // Validate worker barcode
  const validateWorkerBarcode = useCallback(
    debounce(async (barcode) => {
      try {
        const response = await fetch("/api/validateWorker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerBarcode: barcode }),
        });
        const data = await response.json();
        setIsWorkerValid(data.valid);

        if (!data.valid) {
          setError("Invalid worker barcode. Please enter a valid barcode.");
        } else {
          setError("");
        }
      } catch (error) {
        setError("An error occurred during validation.");
      }
    }, 300),
    []
  );

  const handleWorkerBarcodeChange = (e) => {
    const barcode = e.target.value;
    setWorkerBarcode(barcode);

    if (barcode.length > 0) {
      validateWorkerBarcode(barcode);
    } else {
      setIsWorkerValid(false);
      setError("");
    }
  };

  // Autocomplete for part number
  const fetchSuggestions = useCallback(
    debounce(async (inputValue) => {
      try {
        const response = await fetch(
          `/api/items?partNumber=${encodeURIComponent(inputValue)}`
        );
        const data = await response.json();
        setSuggestions(data);
        setIsSuggestionsVisible(true);
      } catch (error) {
        // ignore
      }
    }, 500),
    []
  );

  const handlePartNumberChange = (e) => {
    const inputValue = e.target.value;
    setPartNumber(inputValue);

    if (inputValue.length > 2) {
      fetchSuggestions(inputValue);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
      selectSuggestion(activeSuggestionIndex);
    }
  };

  const selectSuggestion = (index) => {
    const selected = suggestions[index];
    setPartNumber(selected.part_number);
    setIsSuggestionsVisible(false);
    setActiveSuggestionIndex(-1);
  };

  const highlightMatch = (text, match) => {
    if (!text || !match) return text;
    const regex = new RegExp(`(${match})`, "i");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className={styles.match}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const validateInputs = () => {
    if (isNaN(quantity) || quantity <= 0) {
      setError("Quantity must be a positive number.");
      return false;
    }
    if (isNaN(copy) || copy <= 0) {
      setError("Copy must be a positive number.");
      return false;
    }
    if (!Inventory_ID) {
      setError("Inventory ID must be filled.");
      return false;
    }
    setError("");
    return true;
  };

  const canPrint = () => {
    return (
      isWorkerValid &&
      (Inventory_ID?.trim() || "") !== "" &&
      (part_number?.trim() || "") !== "" &&
      (warehouse_Id?.trim() || "") !== "" &&
      quantity > 0 &&
      copy > 0
    );
  };

  const handlePrint = () => {
    if (!validateInputs()) return;

    const time_submitted = new Date().toISOString();

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=80mm, initial-scale=1.0" />
        <title>Print QR Codes</title>
        <style>
        html { width: 80mm; height: 80mm; }
        body {
          width: 80mm;
          height: 80mm;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        #print-root { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
      </html>
    `);
    printWindow.document.close();

    const printRoot = printWindow.document.getElementById("print-root");
    const root = createRoot(printRoot);

    const templates = [];
    for (let i = 0; i < copy; i++) {
      templates.push(
        <QRCodeTemplate
          key={i}
          Inventory_ID={Inventory_ID}
          part_number={part_number}
          quantity={quantity}
          warehouse_Id={warehouse_Id}
          workerBarcode={workerBarcode}
          time_submitted={time_submitted}
        />
      );
    }

    root.render(<>{templates}</>);
    printWindow.focus();
    printWindow.print();

    // ✅ Track fg order usage
    fetch("/api/barcode/track-used", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prod_order_id: prodOrderId,
        type: "finish_good",
        used_at: new Date()
      }),
    });
  };

  const handlePrintA4 = () => {
    if (!validateInputs()) return;

    const time_submitted = new Date().toISOString();

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=210mm, initial-scale=1.0" />
        <title>Print QR Codes on A4</title>
        <style>
        @page { size: A4 landscape; margin: 1mm; }
        body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0mm;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
        }
        #print-root {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(4, 1fr);
          gap: 1mm;
          page-break-inside: avoid;
        }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
      </html>
    `);
    printWindow.document.close();

    const printRoot = printWindow.document.getElementById("print-root");
    const root = createRoot(printRoot);

    const templates = [];
    for (let i = 0; i < copy; i++) {
      templates.push(
        <QRCodeTemplateA4
          key={i}
          Inventory_ID={Inventory_ID}
          part_number={part_number}
          quantity={quantity}
          warehouse_Id={warehouse_Id}
          workerBarcode={workerBarcode}
          time_submitted={time_submitted}
        />
      );
    }

    root.render(<>{templates}</>);
    printWindow.focus();
    printWindow.print();
  
      // ✅ Track production order usage
    fetch("/api/barcode/track-used", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prod_order_id: prodOrderId,
        type: "finish_good",
        used_at: new Date()
      }),
    });
  };

  return (
    <div className={styles.container}>
      {/* Worker Barcode */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Worker Barcode:</label>
        <input
          type="text"
          value={workerBarcode}
          onChange={handleWorkerBarcodeChange}
          className={styles.input}
        />
      </div>
      {/* Inventory ID */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Inventory ID:</label>
        <input
          type="text"
          value={Inventory_ID}
          className={styles.input}
          readOnly
          disabled
        />
      </div>
<div className={styles.formGroup}>
        <label className={styles.label}>Production Order:</label>
        <Select
          options={prodOptionsMapped}
          placeholder="Pilih Production Order"
          isDisabled={!isWorkerValid}
          value={prodOptionsMapped.find(opt => opt.value === prodOrderId)}
          onChange={(selected) => {
            if (selected) {
              setProdOrderId(selected.value);
              setPartNumber(selected.partNumber || "");
              setQuantity(Number(selected.quantity) || 1);
            }
          }}
        />
      </div>
      {/* Part Number */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Part Number:</label>
        <input
          type="text"
          value={part_number}
          onChange={handlePartNumberChange}
          onKeyDown={handleKeyDown}
          className={styles.input}
          readOnly disabled
        />
        {suggestions.length > 0 && isSuggestionsVisible && (
          <ul className={styles.suggestionsList} role="listbox">
            {suggestions.map((item, index) => (
              <li
                key={index}
                role="option"
                aria-selected={index === activeSuggestionIndex}
                className={`${styles.suggestionItem} ${
                  index === activeSuggestionIndex ? styles.active : ""
                }`}
                onClick={() => selectSuggestion(index)}
              >
                {highlightMatch(
                  item.part_number || "Not Found",
                  part_number || ""
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Quantity */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Quantity:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
          className={styles.input}
          readOnly disabled
        />
      </div>
      {/* Warehouse ID */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Warehouse ID:</label>
        <input
          type="text"
          value={warehouse_Id}
          onChange={(e) => setWarehouse_Id(e.target.value)}
          className={styles.input}
          readOnly disabled
        />
      </div>
      {/* Copy */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Copy:</label>
        <input
          type="number"
          value={copy}
          onChange={(e) => setCopy(Number(e.target.value))}
          min="1"
          className={styles.input}
          disabled={!isWorkerValid}
        />
      </div>
      {/* Error */}
      {error && <p className={styles.error}>{error}</p>}
      {/* Print Buttons */}
      <div className={styles.buttonGroup}>
        <button
          onClick={handlePrint}
          className={styles.button}
          disabled={!canPrint()}
        >
          Print QR Codes
        </button>
        <button
          onClick={handlePrintA4}
          className={styles.button}
          disabled={!canPrint()}
        >
          Print on A4
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;