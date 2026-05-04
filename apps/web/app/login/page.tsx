"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api-production-6aa5.up.railway.app";

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

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantCode,
          username,
          pin,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.message || "Errore login");
      }

      const token = data?.token || data?.access_token || data?.accessToken;

      if (!token) {
        throw new Error("Token non ricevuto");
      }

      localStorage.setItem("salonpro_token", token);
      localStorage.setItem("token", token);

      router.push("/agenda");
    } catch (err: any) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <p style={kickerStyle}>SALON PRO</p>

        <h1 style={titleStyle}>Accesso salone</h1>

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
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
          />

          {error ? <div style={errorStyle}>{error}</div> : null}

          <button onClick={login} disabled={loading} style={buttonStyle}>
            {loading ? "Accesso..." : "Entra"}
          </button>
        </div>
      </section>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(circle at top left, rgba(139,92,246,0.30), transparent 35%), linear-gradient(180deg,#050505,#0b0710)",
  color: "#fff",
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 460,
  borderRadius: 28,
  padding: 30,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(212,175,55,0.25)",
  boxShadow: "0 28px 80px rgba(0,0,0,0.35)",
};

const kickerStyle: React.CSSProperties = {
  color: "#d4af37",
  fontWeight: 950,
  letterSpacing: "0.32em",
  fontSize: 13,
};

const titleStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 38,
  lineHeight: 1,
  fontWeight: 950,
};

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

const errorStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
  fontWeight: 800,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 16,
  padding: "16px 18px",
  background: "linear-gradient(135deg,#8b5cf6,#d4af37)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};