"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();

  function logout() {
    clearToken();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" className="sp-change-button" onClick={logout}>
      ESCI / CAMBIA SALONE
    </button>
  );
}
