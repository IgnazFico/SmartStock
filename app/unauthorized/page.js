"use client";

import { useSession } from "next-auth/react";

export default function UnauthorizedPage() {
  const { data: session, status } = useSession();

  return (
    <div
      style={{
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#fff",
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 42,
            fontWeight: "800",
            color: "#ef4444",
            marginBottom: 12,
            letterSpacing: 1.2,
          }}
        >
          Unauthorized Access
        </h1>
        <p style={{ fontSize: 18, color: "#e2e8f0", lineHeight: 1.6 }}>
          You do not have permission to view this page.
          <br />
          Please contact your administrator if you believe this is a mistake.
        </p>
      </div>

      <div
        style={{
          borderRadius: 18,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.82)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
          border: "1.5px solid rgba(255,255,255,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          color: "#1e293b",
        }}
      >
        <h3
          style={{
            color: "#075985",
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Session Details
        </h3>

        {status === "loading" && (
          <p style={{ color: "#999", textAlign: "center" }}>
            Loading session...
          </p>
        )}

        {status === "unauthenticated" && (
          <p style={{ color: "#ef4444", textAlign: "center" }}>
            No session found.
          </p>
        )}

        {session && session.user && (
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 12,
              padding: 20,
              fontSize: 15,
              color: "#1e293b",
              marginBottom: 12,
              lineHeight: 1.6,
              boxShadow: "0 2px 8px rgba(7,77,111,0.07)",
            }}
          >
            <div>
              <b>Name:</b> {session.user.name}
            </div>
            <div>
              <b>Email:</b> {session.user.email}
            </div>
            {session.user.role && (
              <div>
                <b>Role:</b> {session.user.role}
              </div>
            )}
            {session.user.department && (
              <div>
                <b>Department:</b> {session.user.department}
              </div>
            )}
          </div>
        )}

        {session && (
          <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>
            <b>Session Expires:</b> {new Date(session.expires).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
