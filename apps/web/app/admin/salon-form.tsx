"use client";
export const salonFields: Record<string, string> = {
  name: "Nome commerciale",
  code: "Codice salone",
  businessName: "Ragione sociale",
  vatNumber: "Partita IVA",
  taxCode: "Codice fiscale",
  address: "Indirizzo",
  postalCode: "CAP",
  city: "Comune",
  province: "Provincia",
  email: "Email salone",
  phone: "Telefono",
  ownerName: "Nome titolare",
  ownerEmail: "Email titolare",
  plan: "Piano commerciale",
};
export function SalonFields({
  values = {},
}: {
  values?: Record<string, string>;
}) {
  return (
    <div className="form-grid">
      {Object.entries(salonFields).map(([key, label]) => (
        <label key={key}>
          {label}
          <input
            name={key}
            defaultValue={values[key] || ""}
            required={!["taxCode", "plan"].includes(key)}
            type={key.toLowerCase().includes("email") ? "email" : "text"}
            maxLength={key === "province" ? 2 : key === "vatNumber" ? 11 : 200}
          />
        </label>
      ))}
    </div>
  );
}
