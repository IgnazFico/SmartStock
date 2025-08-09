"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./NavBar.module.css";
import { signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const role = session?.user?.role;
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  const [isScanOpen, setScanOpen] = useState(false);
  const [isPrintOpen, setPrintOpen] = useState(false);
  const [isPurchaseOpen, setPurchaseOpen] = useState(false);
  const [isMasterDataOpen, setMasterDataOpen] = useState(false);

  const router = useRouter();

  function handleLogOut() {
    signOut();
  }

  return (
    <div className={styles.container}>
      <nav className={styles.verticalNav}>
        <div className={styles.company} onClick={() => router.push("/")}>
          <img className={styles.logo} alt="Printec" src="/favicon.ico" />
          <h3>Printec</h3>
        </div>
        <hr className={styles.rounded}></hr>
        <ul className={styles.list}>
          <li>
            <div
              className={styles.dropdown}
              onClick={() => setScanOpen(!isScanOpen)}
            >
              <img src="/scan-svgrepo-com.svg" alt="Scan" />
              Scan
            </div>
            {isScanOpen && (
              <ul className={styles.dropdownMenu}>
                <li>
                  <a href="/scan/scan_fg">Scan FG</a>
                </li>
                <li>
                  <a href="/scan/scan_prd">Scan Production</a>
                </li>
                <li>
                  <a href="/scan/scan_rm">Scan RM</a>
                </li>
              </ul>
            )}
          </li>
          <li>
            <a href="/log">
              <img src="/log-svgrepo-com.svg" alt="Log" />
              Log
            </a>
          </li>
          <li>
            <div
              className={styles.dropdown}
              onClick={() => setInventoryOpen(!isInventoryOpen)}
            >
              <img src="/inventory_icon.png" alt="Inventory" />
              Inventory
            </div>
            {isInventoryOpen && (
              <ul className={styles.dropdownMenu}>
                <li>
                  <a href="/inventory/rm">Raw Material Warehouse</a>
                </li>
                <li>
                  <a href="/inventory/wip_inventory">Production Warehouse</a>
                </li>
                <li>
                  <a href="/inventory/fg">FG Warehouse</a>
                </li>
              </ul>
            )}
          </li>
          <li>
            <div
              className={styles.dropdown}
              onClick={() => setPrintOpen(!isPrintOpen)}
            >
              <img src="/print-svgrepo-com.svg" alt="Print" />
              Print
            </div>
            {isPrintOpen && (
              <ul className={styles.dropdownMenu}>
                <li>
                  <a href="/print/print_fg">Print QR FG</a>
                </li>
                <li>
                  <a href="/print/print_prd">Print QR Production</a>
                </li>
                <li>
                  <a href="/print/print_rm">Print QR RM</a>
                </li>
              </ul>
            )}
          </li>
          <li>
            <a href="/production">
              <img src="/production-order.svg" alt="Production" />
              Production Order
            </a>
          </li>
          <li>
            <a href="/production-tracking">
              <img src="/production-tracking.svg" alt="Production Tracking" />
              Production Tracking
            </a>
          </li>
          <li>
            <div
              className={styles.dropdown}
              onClick={() => setPurchaseOpen(!isPurchaseOpen)}
            >
              <img src="/purchase.svg" alt="Purchase" />
              Purchase
            </div>
            {isPurchaseOpen && (
              <ul className={styles.dropdownMenu}>
                <li>
                  <a href="/pr">Purchase Request</a>
                </li>
                <li>
                  <a href="/po">Purchase Order</a>
                </li>
                <li>
                  <a href="/receiving">Receiving</a>
                </li>
              </ul>
            )}
          </li>
          {(role === "admin" || role === "super") && (
            <li>
              <a href="/auth/register">
                <img src="/add-user-svgrepo-com.svg" alt="Register" />
                Register
              </a>
            </li>
          )}
          {(role === "admin" || role === "super") && (
            <li>
              <div
                className={styles.dropdown}
                onClick={() => setMasterDataOpen(!isMasterDataOpen)}
              >
                <img src="/master-data.png" alt="Master Data" />
                Master Data
              </div>
              {isMasterDataOpen && (
                <ul className={styles.dropdownMenu}>
                  <li>
                    <a href="/master_data/view-bom">BoM</a>
                  </li>
                  <li>
                    <a href="/master_data/view-routing">Routing</a>
                  </li>
                  <li>
                    <a href="/master_data/warehouse">Warehousing</a>
                  </li>
                  <li>
                    <a href="/master_data/item">Items</a>
                  </li>
                  <li>
                    <a href="/master_data/supplier">Supplier</a>
                  </li>
                </ul>
              )}
            </li>
          )}
          <li>
            <a onClick={handleLogOut} href="/auth">
              <img src="/login-svgrepo-com.svg" alt="Logout Icon" />
              Logout
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
