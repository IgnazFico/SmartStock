import { useState, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import Select from "react-select";
import QRCodeTemplate from "./QRCodeTemplatePrd";
import QRCodeTemplateA4 from "./QRCodeTemplateA4Prd";
import { createRoot } from "react-dom/client";
import styles from "./QRCodeGeneratorPrd.module.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const QRCodeGenerator = () => {
  const { data: session, status } = useSession(); // 🟢 Harus di sini
  const router = useRouter();

  const [workerBarcode, setWorkerBarcode] = useState("");
  const [isWorkerValid, setIsWorkerValid] = useState(false);
  const [WipId, setWipId] = useState("");
  const [prodOrderId, setProdOrderId] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [copy, setCopy] = useState(1);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [warehouse_Id, setWarehouse_Id] = useState("wh_wip");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(true);
  const [prodOptions, setProdOptions] = useState([]);
  // ⛔ Blokir user yang tidak berasal dari Logistics atau tidak admin/super
  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user;
    if (
      !user ||
      (!["production"].includes(user.department?.toLowerCase()) &&
        !["admin", "super"].includes(user.role))
    ) {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (isWorkerValid) {
      fetch("/api/generateWipId")
        .then((res) => res.json())
        .then((data) => setWipId(data.wipId))
        .catch(() => setWipId(""));
    } else {
      setWipId("");
    }
  }, [isWorkerValid]);

  // Fetch Production Order list (only unused)
  useEffect(() => {
    if (isWorkerValid) {
      fetch("/api/barcode/available-prod-orders")
        .then((res) => res.json())
        .then((data) => setProdOptions(data))
        .catch(() => setProdOptions([]));
    }
  }, [isWorkerValid]);

  const prodOptionsMapped = prodOptions.map((item) => ({
    value: item.prod_order_id,
    label: item.prod_order_id,
    partNumber: item.material_ID,
    quantity: item.quantity,
  }));

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
        if (!data.valid) setError("Invalid worker barcode.");
        else setError("");
      } catch (error) {
        setError("Validation error.");
      }
    }, 300),
    []
  );

  const handleWorkerBarcodeChange = (e) => {
    const barcode = e.target.value;
    setWorkerBarcode(barcode);
    if (barcode.length > 0) validateWorkerBarcode(barcode);
    else {
      setIsWorkerValid(false);
      setError("");
    }
  };

  const fetchSuggestions = useCallback(
    debounce(async (inputValue) => {
      try {
        const response = await fetch(
          `/api/items?partNumber=${encodeURIComponent(inputValue)}`
        );
        const data = await response.json();
        setSuggestions(data);
        setIsSuggestionsVisible(true);
      } catch (_) {}
    }, 500),
    []
  );

  const handlePartNumberChange = (e) => {
    const inputValue = e.target.value;
    setPartNumber(inputValue);
    if (inputValue.length > 2) fetchSuggestions(inputValue);
    else setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveSuggestionIndex((prev) =>
        Math.min(prev + 1, suggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
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
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className={styles.match}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const validateInputs = () => {
    if (quantity <= 0 || copy <= 0) {
      setError("Quantity and Copy must be positive numbers.");
      return false;
    }
    setError("");
    return true;
  };

  const canPrint = () => {
    return (
      isWorkerValid &&
      WipId &&
      prodOrderId &&
      warehouse_Id &&
      partNumber &&
      quantity > 0 &&
      copy > 0
    );
  };

  const generateUniqueId = () =>
    `${Date.now()}${Math.floor(Math.random() * 10000)}`;

  const handlePrint = () => {
    if (!validateInputs()) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Print</title><style>
        html, body { width: 80mm; height: 80mm; margin: 0; padding: 0; }
        #print-root { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; }
      </style></head><body><div id="print-root"></div></body></html>
    `);
    printWindow.document.close();

    const root = createRoot(printWindow.document.getElementById("print-root"));
    const templates = Array.from({ length: copy }, (_, i) => (
      <QRCodeTemplate
        key={i}
        wipId={WipId}
        poNumber={prodOrderId}
        partNumber={partNumber}
        quantity={quantity}
        uniqueId={generateUniqueId()}
        workerBarcode={workerBarcode}
      />
    ));

    root.render(<>{templates}</>);
    printWindow.focus();
    printWindow.print();

    // ✅ Track production order usage
    fetch("/api/barcode/track-used", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prod_order_id: prodOrderId,
        type: "production",
        used_at: new Date(),
      }),
    });
  };

  const handlePrintA4 = () => {
    if (!validateInputs()) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Print</title><style>
        @page { size: A4 landscape; margin: 1mm; }
        body {
          width: 210mm; height: 297mm; margin: 0; padding: 0;
          display: grid; grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(4, 1fr); gap: 1mm;
        }
        #print-root { width: 100%; height: 100%; }
      </style></head><body><div id="print-root"></div></body></html>
    `);
    printWindow.document.close();

    const root = createRoot(printWindow.document.getElementById("print-root"));
    const templates = Array.from({ length: copy }, (_, i) => (
      <QRCodeTemplateA4
        key={i}
        wipId={WipId}
        poNumber={prodOrderId}
        partNumber={partNumber}
        quantity={quantity}
        uniqueId={generateUniqueId()}
        workerBarcode={workerBarcode}
      />
    ));

    root.render(<>{templates}</>);
    printWindow.focus();
    printWindow.print();

    // ✅ Track usage
    fetch("/api/barcode/track-used", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prod_order_id: prodOrderId,
        type: "production",
        used_at: new Date(),
      }),
    });
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
        <label className={styles.label}>WIP ID:</label>
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
        <Select
          options={prodOptionsMapped}
          placeholder="SELECT PRODUCTION ORDER"
          isDisabled={!isWorkerValid}
          value={prodOptionsMapped.find((opt) => opt.value === prodOrderId)}
          onChange={(selected) => {
            if (selected) {
              setProdOrderId(selected.value);
              setPartNumber(selected.partNumber || "");
              setQuantity(Number(selected.quantity) || 1);
            }
          }}
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
          readonly
          disabled
        />
        {suggestions.length > 0 && isSuggestionsVisible && (
          <ul className={styles.suggestionsList}>
            {suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => selectSuggestion(index)}
                className={index === activeSuggestionIndex ? styles.active : ""}
              >
                {highlightMatch(item.part_number || "", partNumber)}
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
          className={styles.input}
          min="1"
          readonly
          disabled
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
          readOnly
          disabled
        />
      </div>
      {/* <div className={styles.formGroup}>
        <label className={styles.label}>Copy:</label>
        <input 
          type="number" 
          value={copy} 
          onChange={(e) => setCopy(Number(e.target.value))} 
          className={styles.input} min="1" 
          disabled={!isWorkerValid} />
      </div> */}
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
