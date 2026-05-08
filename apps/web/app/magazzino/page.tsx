"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductType = "INTERNAL" | "RETAIL";

type Product = {
  id: string;
  name: string;
  category: string;
  productType: ProductType;
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
  sellPrice: number;
  supplier?: string | null;
};

type RecipeItem = {
  id: string;
  serviceName: string;
  productCategory?: string;
  productId: string;
  quantity: number;
  product: Product;
};

const PRODUCT_CATEGORIES = [
  "Shampoo",
  "Maschera",
  "Tonalizzante",
  "Colore",
  "Decolorante",
  "Ossigeno",
  "Fiala",
];

const RECIPE_CATEGORIES = [
  "Shampoo",
  "Maschera",
  "Tonalizzante",
  "Colore",
  "Decolorante",
  "Ossigeno",
  "Fiala",
];

const SERVICES = [
  "Piega",
  "Piega Atelier Extra Styling",
  "Taglio Donna",
  "Taglio Donna + Piega",
  "Shampoo + Taglio Uomo",
  "Barba Rifinitura",
  "Colore Base",
  "Colore Base + Piega",
  "Colore Base + Taglio + Piega",
  "Tonalizzante/Gloss",
  "Tonalizzante + Piega",
  "Decapaggio Colore",
  "Decapaggio + Piega",
  "Schiariture Parziali Meches Light",
  "Colpi di Sole/Meches + Piega",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function MagazzinoPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Shampoo");
  const [productType, setProductType] = useState<ProductType>("INTERNAL");
  const [unit, setUnit] = useState("pz");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [cost, setCost] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [recipeService, setRecipeService] = useState(SERVICES[0]);
  const [recipeCategory, setRecipeCategory] = useState("Shampoo");
  const [recipeProductId, setRecipeProductId] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("");
  const [recipeDrafts, setRecipeDrafts] = useState<Record<string, { productId: string; quantity: string }>>({});

  async function fetchWithAuth(path: string, options?: RequestInit) {
    const token = localStorage.getItem("salonpro_token") || localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      throw new Error("Token mancante");
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.message || text || "Errore richiesta");
    }

    return data;
  }

  function recipeKey(serviceName: string, category: string) {
    return `${serviceName}___${category}`;
  }

  function buildRecipeDrafts(list: RecipeItem[]) {
    const next: Record<string, { productId: string; quantity: string }> = {};

    list.forEach((recipe) => {
      const category = recipe.productCategory || recipe.product?.category || "Shampoo";
      next[recipeKey(recipe.serviceName, category)] = {
        productId: recipe.productId,
        quantity: String(recipe.quantity || ""),
      };
    });

    return next;
  }

  function recipeProductOptions(category: string) {
    return products.filter((product) => {
      if (product.productType !== "INTERNAL") return false;

      const productCategory = String(product.category || "").toLowerCase();
      const selectedCategory = category.toLowerCase();

      return !productCategory || productCategory === selectedCategory;
    });
  }

  function updateRecipeDraft(
    serviceName: string,
    category: string,
    field: "productId" | "quantity",
    value: string,
  ) {
    const key = recipeKey(serviceName, category);

    setRecipeDrafts((prev) => ({
      ...prev,
      [key]: {
        productId: prev[key]?.productId || "",
        quantity: prev[key]?.quantity || "",
        [field]: value,
      },
    }));
  }

  async function saveRecipeCell(serviceName: string, category: string) {
    const key = recipeKey(serviceName, category);
    const draft = recipeDrafts[key] || { productId: "", quantity: "" };
    const quantity = Number(String(draft.quantity || 0).replace(",", "."));

    try {
      const existing = recipes.filter((recipe) => {
        const recipeCategory = recipe.productCategory || recipe.product?.category || "Shampoo";
        return recipe.serviceName === serviceName && recipeCategory === category;
      });

      for (const recipe of existing) {
        await fetchWithAuth(`/inventory/recipes/${recipe.id}`, {
          method: "DELETE",
        });
      }

      if (draft.productId && quantity > 0) {
        await fetchWithAuth("/inventory/recipes", {
          method: "POST",
          body: JSON.stringify({
            serviceName,
            productCategory: category,
            productId: draft.productId,
            quantity,
          }),
        });
      }

      setMessage("✅ Ricetta servizio aggiornata.");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore salvataggio ricetta"}`);
    }
  }

  async function clearRecipeCell(serviceName: string, category: string) {
    const key = recipeKey(serviceName, category);

    try {
      const existing = recipes.filter((recipe) => {
        const recipeCategory = recipe.productCategory || recipe.product?.category || "Shampoo";
        return recipe.serviceName === serviceName && recipeCategory === category;
      });

      for (const recipe of existing) {
        await fetchWithAuth(`/inventory/recipes/${recipe.id}`, {
          method: "DELETE",
        });
      }

      setRecipeDrafts((prev) => ({
        ...prev,
        [key]: {
          productId: "",
          quantity: "",
        },
      }));

      setMessage("✅ Prodotto rimosso dalla ricetta.");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore rimozione ricetta"}`);
    }
  }

  async function loadData() {
    try {
      setMessage("");

      const [productsData, recipesData] = await Promise.all([
        fetchWithAuth("/inventory/products"),
        fetchWithAuth("/inventory/recipes"),
      ]);

      setProducts(productsData || []);

      const recipeList = recipesData || [];
      setRecipes(recipeList);
      setRecipeDrafts(buildRecipeDrafts(recipeList));

      if (productsData?.length && !recipeProductId) {
        const firstInternal = productsData.find((p: Product) => p.productType === "INTERNAL");
        if (firstInternal) setRecipeProductId(firstInternal.id);
      }
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore caricamento magazzino"}`);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return products;

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.supplier || "").toLowerCase().includes(q) ||
        p.productType.toLowerCase().includes(q),
    );
  }, [products, search]);

  const internalProducts = products.filter((p) => p.productType === "INTERNAL");
  const recipeProductsByCategory = products.filter(
    (p) =>
      p.productType === "INTERNAL" &&
      String(p.category || "").toLowerCase() === recipeCategory.toLowerCase(),
  );


  const retailProducts = products.filter((p) => p.productType === "RETAIL");

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.cost, 0);
  }, [products]);

  const potentialRevenue = useMemo(() => {
    return retailProducts.reduce((sum, p) => sum + p.stock * p.sellPrice, 0);
  }, [retailProducts]);

  const potentialProfit = potentialRevenue - retailProducts.reduce((sum, p) => sum + p.stock * p.cost, 0);

  const lowStock = products.filter((p) => p.stock <= p.minStock);

  async function addProduct() {
    try {
      if (!name.trim()) {
        setMessage("⚠️ Inserisci nome prodotto.");
        return;
      }

      await fetchWithAuth("/inventory/products", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          category,
          productType,
          unit,
          stock: Number(String(stock || 0).replace(",", ".")),
          minStock: Number(String(minStock || 0).replace(",", ".")),
          cost: Number(String(cost || 0).replace(",", ".")),
          sellPrice: productType === "RETAIL" ? Number(String(sellPrice || 0).replace(",", ".")) : 0,
          supplier: supplier.trim() || "Non indicato",
        }),
      });

      setName("");
      setStock("");
      setMinStock("");
      setCost("");
      setSellPrice("");
      setSupplier("");
      setMessage("✅ Prodotto aggiunto al magazzino.");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore salvataggio prodotto"}`);
    }
  }

  async function updateStock(id: string, delta: number) {
    try {
      await fetchWithAuth(`/inventory/products/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify({ delta }),
      });

      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore aggiornamento stock"}`);
    }
  }

  async function removeProduct(id: string) {
    const ok = confirm("Vuoi eliminare questo prodotto dal magazzino?");
    if (!ok) return;

    try {
      await fetchWithAuth(`/inventory/products/${id}`, {
        method: "DELETE",
      });

      setMessage("✅ Prodotto eliminato.");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore eliminazione prodotto"}`);
    }
  }

  async function addRecipeItem() {
    try {
      if (!recipeService) {
        setMessage("⚠️ Seleziona servizio.");
        return;
      }

      if (!recipeProductId) {
        setMessage("⚠️ Seleziona prodotto uso interno.");
        return;
      }

      const quantity = Number(String(recipeQuantity || 0).replace(",", "."));

      if (quantity <= 0) {
        setMessage("⚠️ Inserisci quantità consumo.");
        return;
      }

      await fetchWithAuth("/inventory/recipes", {
        method: "POST",
        body: JSON.stringify({
          serviceName: recipeService,
          productCategory: recipeCategory,
          productId: recipeProductId,
          quantity,
        }),
      });

      setRecipeQuantity("");
      setMessage("✅ Ricetta servizio salvata.");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore salvataggio ricetta"}`);
    }
  }

  async function removeRecipe(id: string) {
    try {
      await fetchWithAuth(`/inventory/recipes/${id}`, {
        method: "DELETE",
      });

      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore eliminazione ricetta"}`);
    }
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={header}>
          <div>
            <div style={eyebrow}>Magazzino Profitto</div>
            <h1 className="sp-title">Prodotti, scorte e margini</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Uso interno per servizi e rivendita cliente con scarico automatico dalla cassa.
            </p>
          </div>

          <button className="sp-button-purple" onClick={loadData}>
            Aggiorna magazzino
          </button>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section style={kpiGrid}>
          <Kpi title="Valore tecnico magazzino" value={`€ ${totalStockValue.toFixed(2)}`} sub="Valore tecnico prodotti" />
          <Kpi title="Ricavo potenziale" value={`€ ${potentialRevenue.toFixed(2)}`} sub="Solo prodotti rivendita" />
          <Kpi title="Margine potenziale" value={`€ ${potentialProfit.toFixed(2)}`} sub="Profitto teorico rivendita" />
          <Kpi title="Scorte basse" value={String(lowStock.length)} sub="Da riordinare" danger={lowStock.length > 0} />
        </section>

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Nuovo prodotto</div>
              <h2 style={sectionTitle}>Aggiungi al magazzino</h2>
            </div>
          </div>

          <div style={grid4}>
            <input className="sp-input" placeholder="Nome prodotto" value={name} onChange={(e) => setName(e.target.value)} />

            <select className="sp-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select className="sp-input" value={productType} onChange={(e) => setProductType(e.target.value as ProductType)}>
              <option value="INTERNAL">Uso interno servizi</option>
              <option value="RETAIL">Rivendita cliente</option>
            </select>

            <button className="sp-button-purple" onClick={addProduct}>
              Aggiungi prodotto
            </button>
          </div>

          <div style={grid5}>
            <select className="sp-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="pz">pz</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
            </select>

            <input className="sp-input" placeholder="Quantità" value={stock} onChange={(e) => setStock(e.target.value)} />
            <input className="sp-input" placeholder="Scorta minima" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
            <input className="sp-input" placeholder="Costo confezione/stock €" value={cost} onChange={(e) => setCost(e.target.value)} />
            <input
              className="sp-input"
              placeholder={productType === "RETAIL" ? "Prezzo vendita €" : "Prezzo vendita non usato"}
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              disabled={productType === "INTERNAL"}
            />
          </div>

          <input
            className="sp-input"
            placeholder="Fornitore"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </section>

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Ricette servizi</div>
              <h2 style={sectionTitle}>Ricetta prodotti per servizio</h2>
            </div>
          </div>

          <div style={recipeHelpBox}>
            <strong>Come funziona:</strong> per ogni servizio puoi aggiungere più prodotti usati.
            Esempio: Piega → Shampoo 10 ml + Maschera 8 ml + Fiala 1 pz.
            Ogni riga che salvi aggiunge un prodotto alla ricetta dello stesso servizio.
          </div>

          <div style={recipeSimpleNote}>
            <strong>Modalità semplice:</strong> ogni riga è un servizio. Per ogni tipologia scegli il prodotto usato e la quantità.
            Puoi salvare o modificare tutto direttamente sulla stessa riga.
          </div>

          <div style={recipeMatrixWrap}>
            <table style={recipeMatrixTable}>
              <thead>
                <tr>
                  <th style={th}>Servizio</th>
                  {RECIPE_CATEGORIES.map((category) => (
                    <th key={category} style={th}>
                      {category}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {SERVICES.map((service) => (
                  <tr key={service}>
                    <td style={recipeServiceCell}>{service}</td>

                    {RECIPE_CATEGORIES.map((category) => {
                      const key = recipeKey(service, category);
                      const draft = recipeDrafts[key] || { productId: "", quantity: "" };
                      const options = recipeProductOptions(category);
                      const selectedProduct = products.find((product) => product.id === draft.productId);

                      return (
                        <td key={category} style={recipeCell}>
                          <select
                            className="sp-input"
                            style={recipeMiniSelect}
                            value={draft.productId}
                            onChange={(e) =>
                              updateRecipeDraft(service, category, "productId", e.target.value)
                            }
                          >
                            <option value="">Nessuno</option>
                            {options.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.unit})
                              </option>
                            ))}
                          </select>

                          <div style={recipeInlineControls}>
                            <input
                              className="sp-input"
                              style={recipeMiniInput}
                              placeholder={selectedProduct?.unit ? `q.tà ${selectedProduct.unit}` : "q.tà"}
                              value={draft.quantity}
                              onChange={(e) =>
                                updateRecipeDraft(service, category, "quantity", e.target.value)
                              }
                            />

                            <button
                              type="button"
                              style={recipeSaveMini}
                              onClick={() => saveRecipeCell(service, category)}
                            >
                              Salva
                            </button>

                            {draft.productId ? (
                              <button
                                type="button"
                                style={recipeClearMini}
                                onClick={() => clearRecipeCell(service, category)}
                              >
                                X
                              </button>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={mainGrid}>
          <div className="sp-card" style={cardPad}>
            <div style={sectionHeader}>
              <div>
                <div style={greenKicker}>Inventario</div>
                <h2 style={sectionTitle}>Prodotti in magazzino</h2>
              </div>

              <input
                className="sp-input"
                placeholder="Cerca prodotto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 280 }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Prodotto</th>
                    <th style={th}>Tipo</th>
                    <th style={th}>Cat.</th>
                    <th style={th}>Stock</th>
                    <th style={th}>Costo</th>
                    <th style={th}>Vendita</th>
                    <th style={th}>Margine</th>
                    <th style={th}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const margin = p.productType === "RETAIL" ? p.sellPrice - p.cost : -p.cost;
                    const low = p.stock <= p.minStock;

                    return (
                      <tr key={p.id}>
                        <td style={td}>
                          <strong>{p.name}</strong>
                          <div className="sp-muted" style={{ marginTop: 4 }}>
                            {p.supplier || "Non indicato"}
                          </div>
                        </td>
                        <td style={td}>
                          <span style={p.productType === "RETAIL" ? retailPill : internalPill}>
                            {p.productType === "RETAIL" ? "Rivendita" : "Uso interno"}
                          </span>
                        </td>
                        <td style={td}>{p.category}</td>
                        <td style={td}>
                          <span style={low ? dangerPill : stockPill}>
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td style={td}>€ {p.cost.toFixed(2)}</td>
                        <td style={td}>
                          {p.productType === "RETAIL" ? `€ ${p.sellPrice.toFixed(2)}` : "-"}
                        </td>
                        <td style={td}>
                          <strong style={{ color: margin > 0 ? "#86efac" : "#f87171" }}>
                            € {margin.toFixed(2)}
                          </strong>
                        </td>
                        <td style={td}>
                          <button style={miniBtn} onClick={() => updateStock(p.id, -1)}>
                            -1
                          </button>{" "}
                          <button style={miniPurple} onClick={() => updateStock(p.id, 1)}>
                            +1
                          </button>{" "}
                          <button style={miniDanger} onClick={() => removeProduct(p.id)}>
                            X
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="sp-card" style={cardPad}>
            <div style={greenKicker}>Coach riordino</div>
            <h2 style={sectionTitle}>Prodotti da controllare</h2>

            <div style={{ display: "grid", gap: 12 }}>
              {lowStock.length === 0 ? (
                <div style={emptyBox}>
                  Tutto sotto controllo. Nessun prodotto sotto scorta minima.
                </div>
              ) : (
                lowStock.map((p) => (
                  <div key={p.id} style={alertRow}>
                    <div>
                      <strong>{p.name}</strong>
                      <div className="sp-muted" style={{ marginTop: 4 }}>
                        Stock {p.stock} {p.unit} / minimo {p.minStock} {p.unit}
                      </div>
                      <div style={{ color: "#d4af37", marginTop: 6, fontWeight: 900 }}>
                        {p.productType === "RETAIL" ? "Rivendita" : "Uso interno"} · {p.supplier || "Fornitore non indicato"}
                      </div>
                    </div>

                    <button style={miniPurple} onClick={() => updateStock(p.id, 5)}>
                      +5
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Kpi({
  title,
  value,
  sub,
  danger,
}: {
  title: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div
      className="sp-card"
      style={{
        padding: 20,
        borderColor: danger ? "rgba(239,68,68,0.45)" : "rgba(212,175,55,0.22)",
      }}
    >
      <div className="sp-muted">{title}</div>
      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 900,
          color: danger ? "#f87171" : "#d4af37",
        }}
      >
        {value}
      </div>
      <div className="sp-muted" style={{ marginTop: 8, fontSize: 13 }}>
        {sub}
      </div>
    </div>
  );
}

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 24,
  flexWrap: "wrap",
};

const eyebrow: React.CSSProperties = {
  color: "#d4af37",
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
  textTransform: "uppercase",
};

const messageBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: "rgba(139,92,246,0.14)",
  border: "1px solid rgba(139,92,246,0.32)",
  color: "#fff",
  fontWeight: 900,
};

const kpiGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 20,
};

const cardPad: React.CSSProperties = {
  padding: 24,
  marginBottom: 20,
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 18,
  flexWrap: "wrap",
};

const greenKicker: React.CSSProperties = {
  color: "#22c55e",
  fontWeight: 900,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const sectionTitle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#d4af37",
};

const grid4: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 0.8fr 0.9fr 180px",
  gap: 14,
  marginBottom: 14,
};

const grid5: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.45fr 0.8fr 0.8fr 0.8fr 1fr",
  gap: 14,
  marginBottom: 14,
};

const recipeHelpBox: React.CSSProperties = {
  margin: "12px 0 18px",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(34,197,94,0.22)",
  background: "rgba(34,197,94,0.08)",
  color: "#dcfce7",
  fontWeight: 800,
  lineHeight: 1.45,
};

const recipeSimpleNote: React.CSSProperties = {
  margin: "12px 0 18px",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(34,197,94,0.22)",
  background: "rgba(34,197,94,0.08)",
  color: "#dcfce7",
  fontWeight: 800,
  lineHeight: 1.45,
};

const recipeMatrixWrap: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
};

const recipeMatrixTable: React.CSSProperties = {
  width: "100%",
  minWidth: 1450,
  borderCollapse: "collapse",
};

const recipeServiceCell: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 950,
  minWidth: 210,
  position: "sticky",
  left: 0,
  background: "rgba(10,10,10,0.96)",
  zIndex: 2,
};

const recipeCell: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 800,
  minWidth: 185,
  verticalAlign: "top",
};

const recipeMiniSelect: React.CSSProperties = {
  minWidth: 160,
  height: 42,
  padding: "8px 10px",
  fontSize: 13,
};

const recipeInlineControls: React.CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 8,
  alignItems: "center",
};

const recipeMiniInput: React.CSSProperties = {
  width: 70,
  height: 38,
  padding: "8px 10px",
  fontSize: 13,
};

const recipeSaveMini: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "10px 12px",
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const recipeClearMini: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "10px 12px",
  background: "#ef4444",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const recipeGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1.2fr 0.8fr 180px",
  gap: 14,
};

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.45fr 0.75fr",
  gap: 20,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 980,
};

const th: React.CSSProperties = {
  textAlign: "left",
  color: "#22c55e",
  padding: 14,
  borderBottom: "1px solid rgba(255,255,255,0.12)",
};

const td: React.CSSProperties = {
  padding: 14,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  verticalAlign: "top",
};

const stockPill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.32)",
  color: "#86efac",
  fontWeight: 900,
};

const dangerPill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.32)",
  color: "#fca5a5",
  fontWeight: 900,
};

const internalPill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.14)",
  border: "1px solid rgba(59,130,246,0.32)",
  color: "#93c5fd",
  fontWeight: 900,
};

const retailPill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(168,85,247,0.14)",
  border: "1px solid rgba(168,85,247,0.32)",
  color: "#d8b4fe",
  fontWeight: 900,
};

const miniBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: 0,
  background: "#e8eef8",
  color: "#0f172a",
  fontWeight: 900,
};

const miniPurple: React.CSSProperties = {
  ...miniBtn,
  background: "#8b5cf6",
  color: "#fff",
};

const miniDanger: React.CSSProperties = {
  ...miniBtn,
  background: "#ef4444",
  color: "#fff",
};

const emptyBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#b8bfd0",
};

const alertRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 16,
  borderRadius: 18,
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.24)",
};