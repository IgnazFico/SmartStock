import { useState, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import QRCodeTemplate from "./QRCodeTemplatePrd";
import QRCodeTemplateA4 from "./QRCodeTemplateA4Prd";
import { createRoot } from "react-dom/client";
import styles from "./QRCodeGeneratorPrd.module.css";

const QRCodeGenerator = () => {
  const [workerBarcode, setWorkerBarcode] = useState("");
  const [isWorkerValid, setIsWorkerValid] = useState(false);
  const [WipId, setWipId] = useState("");
  const [prodOrderId, setProdOrderId] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [copy, setCopy] = useState(1);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(true);

  // Fetch WipId otomatis setelah worker valid
  useEffect(() => {
    if (isWorkerValid) {
      fetch("/api/generateWipId")
        .then(res => res.json())
        .then(data => setWipId(data.wipId))
        .catch(() => setWipId(""));
    } else {
      setWipId("");
    }
  }, [isWorkerValid]);

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

  // Tidak perlu handleWipIdChange, field readonly
  const handleProdOrderIdChange = (e) => setProdOrderId(e.target.value);

  // Generate unique ID for each QR
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    return `${timestamp}${randomNum}`;
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
    setError("");
    return true;
  };

  const canPrint = () => {
    return (
      isWorkerValid &&
      (WipId?.trim() || "") !== "" &&
      (prodOrderId?.trim() || "") !== "" &&
      (partNumber?.trim() || "") !== "" &&
      quantity > 0 &&
      copy > 0
    );
  };

  const handlePrint = () => {
    if (!validateInputs()) return;

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
      const uniqueId = generateUniqueId();
      templates.push(
        <QRCodeTemplate
          key={i}
          wipId={WipId}
          poNumber={prodOrderId}
          partNumber={partNumber}
          quantity={quantity}
          uniqueId={uniqueId}
          workerBarcode={workerBarcode}
        />
      );
    }

    root.render(<>{templates}</>);
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintA4 = () => {
    if (!validateInputs()) return;

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
      const uniqueId = generateUniqueId();
      templates.push(
        <QRCodeTemplateA4
          key={i}
          wipId={WipId}
          poNumber={prodOrderId}
          partNumber={partNumber}
          quantity={quantity}
          uniqueId={uniqueId}
          workerBarcode={workerBarcode}
        />
      );
    }

    root.render(<>{templates}</>);
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className={styles.container}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Worker Barcode:</label>
        <input
          type="text"
          value={workerBarcode}
          onChange={handleWorkerBarcodeChange}
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Wip Id:</label>
        <input
          type="text"
          value={WipId}
          className={styles.input}
          readOnly
          disabled
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Production Order:</label>
        <input
          type="text"
          value={prodOrderId}
          onChange={handleProdOrderIdChange}
          className={styles.input}
          disabled={!isWorkerValid}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Part Number:</label>
        <input
          type="text"
          value={partNumber}
          onChange={handlePartNumberChange}
          onKeyDown={handleKeyDown}
          className={styles.input}
          disabled={!isWorkerValid}
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
                  partNumber || ""
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Quantity:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
          className={styles.input}
          disabled={!isWorkerValid}
        />
      </div>
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
      {error && <p className={styles.error}>{error}</p>}
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