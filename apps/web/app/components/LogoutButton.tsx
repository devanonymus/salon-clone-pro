"use client";

import { useRouter } from "next/navigation";
import AppIcon from "./AppIcon";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("salonpro_token");
    localStorage.removeItem("token");
    localStorage.removeItem("salonpro_session");

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      aria-label="Esci"
      title="Esci"
      type="button"
      className={`sp-logout-button ${compact ? "sp-logout-button-compact" : ""}`}
      onClick={logout}
    >
      <AppIcon name="logout" size={17} />
    </button>
  );
}
