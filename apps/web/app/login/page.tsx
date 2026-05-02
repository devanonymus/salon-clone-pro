"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginApi } from "@/src/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [tenantCode, setTenantCode] = useState("SALON1");
  const [username, setUsername] = useState("admin");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    try {
      setLoading(true);
      setError("");

      await loginApi({
        tenantCode,
        username,
        pin,
      });

      router.push("/agenda");
    } catch (err: any) {
      setError(err.message || "Errore login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(139,92,246,0.30), transparent 35%), linear-gradient(180deg,#050505,#0b0710)",
        color: "#fff",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 28,
          padding: 30,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.35)",
        }}
      >
        <p
          style={{
            color: "#d4af37",
            fontWeight: 950,
            letterSpacing: "0.32em",
            fontSize: 13,
          }}
        >
          SALON PRO
        </p>

        <h1
          style={{
            marginTop: 10,
            fontSize: 38,
            lineHeight: 1,
            fontWeight: 950,
          }}
        >
          Accesso salone
        </h1>

        <div style={{ display: "grid", gap: 14, marginTop: 26 }}>
          <input
            value={tenantCode}
            onChange={(e) => setTenantCode(e.target.value)}
            placeholder="Codice salone"
            style={inputStyle}
          />

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={inputStyle}
          />

          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            type="password"
            style={inputStyle}
          />

          {error ? (
            <div
              style={{
                borderRadius: 16,
                padding: 14,
                background: "rgba(239,68,68,0.14)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#fecaca",
                fontWeight: 800,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            onClick={login}
            disabled={loading}
            style={{
              border: 0,
              borderRadius: 16,
              padding: "16px 18px",
              background: "linear-gradient(135deg,#8b5cf6,#d4af37)",
              color: "#fff",
              fontWeight: 950,
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Accesso..." : "Entra"}
          </button>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  border: "1px solid rgba(212,175,55,0.20)",
  background: "rgba(0,0,0,0.38)",
  color: "#fff",
  padding: "15px 16px",
  outline: "none",
  fontWeight: 800,
};