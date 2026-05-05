"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("salonpro_token");
    localStorage.removeItem("token");

    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" className="sp-change-button" onClick={logout}>
      ESCI / CAMBIA SALONE
    </button>
  );
}
