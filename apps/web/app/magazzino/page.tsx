'use client';

import { useMemo, useState } from 'react';

type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  cost: number;
  sellPrice: number;
  supplier: string;
};

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Shampoo Idratante',
    category: 'Shampoo',
    stock: 12,
    minStock: 5,
    cost: 6,
    sellPrice: 18,
    supplier: 'Fornitore Beauty',
  },
  {
    id: '2',
    name: 'Maschera Nutriente',
    category: 'Trattamento',
    stock: 4,
    minStock: 6,
    cost: 8,
    sellPrice: 24,
    supplier: 'Fornitore Beauty',
  },
  {
    id: '3',
    name: 'Ossigeno 20 vol',
    category: 'Tecnico',
    stock: 3,
    minStock: 4,
    cost: 3.5,
    sellPrice: 0,
    supplier: 'Color Pro',
  },
  {
    id: '4',
    name: 'Siero Gloss',
    category: 'Styling',
    stock: 8,
    minStock: 3,
    cost: 7,
    sellPrice: 22,
    supplier: 'Luxury Hair',
  },
];

export default function MagazzinoPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Shampoo');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [cost, setCost] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return products;

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q),
    );
  }, [products, search]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.cost, 0);
  }, [products]);

  const potentialRevenue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.sellPrice, 0);
  }, [products]);

  const potentialProfit = potentialRevenue - totalStockValue;

  const lowStock = products.filter((p) => p.stock <= p.minStock);

  function addProduct() {
    if (!name.trim()) {
      setMessage('⚠️ Inserisci nome prodotto.');
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      stock: Number(stock || 0),
      minStock: Number(minStock || 0),
      cost: Number(cost || 0),
      sellPrice: Number(sellPrice || 0),
      supplier: supplier.trim() || 'Non indicato',
    };

    setProducts((prev) => [newProduct, ...prev]);
    setName('');
    setStock('');
    setMinStock('');
    setCost('');
    setSellPrice('');
    setSupplier('');
    setMessage('✅ Prodotto aggiunto al magazzino.');
  }

  function updateStock(id: string, delta: number) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              stock: Math.max(0, p.stock + delta),
            }
          : p,
      ),
    );
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={header}>
          <div>
            <div style={eyebrow}>Magazzino Profitto</div>
            <h1 className="sp-title">Prodotti, scorte e margini</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Controlla cosa manca, cosa rende e dove il salone sta lasciando margine.
            </p>
          </div>

          <button className="sp-button-purple">Report riordino</button>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section style={kpiGrid}>
          <Kpi title="Valore magazzino" value={`€ ${totalStockValue.toFixed(2)}`} sub="Costo prodotti in stock" />
          <Kpi title="Ricavo potenziale" value={`€ ${potentialRevenue.toFixed(2)}`} sub="Vendita prodotti disponibili" />
          <Kpi title="Margine potenziale" value={`€ ${potentialProfit.toFixed(2)}`} sub="Profitto teorico" />
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
            <input
              className="sp-input"
              placeholder="Nome prodotto"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <select
              className="sp-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Shampoo</option>
              <option>Trattamento</option>
              <option>Styling</option>
              <option>Colore</option>
              <option>Tecnico</option>
              <option>Rivendita</option>
            </select>

            <input
              className="sp-input"
              placeholder="Fornitore"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />

            <button className="sp-button-purple" onClick={addProduct}>
              Aggiungi prodotto
            </button>
          </div>

          <div style={grid4}>
            <input
              className="sp-input"
              placeholder="Quantità"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />

            <input
              className="sp-input"
              placeholder="Scorta minima"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />

            <input
              className="sp-input"
              placeholder="Costo €"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />

            <input
              className="sp-input"
              placeholder="Prezzo vendita €"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
            />
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

            <div style={{ overflowX: 'auto' }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Prodotto</th>
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
                    const margin = p.sellPrice - p.cost;
                    const low = p.stock <= p.minStock;

                    return (
                      <tr key={p.id}>
                        <td style={td}>
                          <strong>{p.name}</strong>
                          <div className="sp-muted" style={{ marginTop: 4 }}>
                            {p.supplier}
                          </div>
                        </td>
                        <td style={td}>{p.category}</td>
                        <td style={td}>
                          <span style={low ? dangerPill : stockPill}>
                            {p.stock} pz
                          </span>
                        </td>
                        <td style={td}>€ {p.cost.toFixed(2)}</td>
                        <td style={td}>€ {p.sellPrice.toFixed(2)}</td>
                        <td style={td}>
                          <strong style={{ color: margin > 0 ? '#86efac' : '#f87171' }}>
                            € {margin.toFixed(2)}
                          </strong>
                        </td>
                        <td style={td}>
                          <button style={miniBtn} onClick={() => updateStock(p.id, -1)}>
                            -1
                          </button>{' '}
                          <button style={miniPurple} onClick={() => updateStock(p.id, 1)}>
                            +1
                          </button>{' '}
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

            <div style={{ display: 'grid', gap: 12 }}>
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
                        Stock {p.stock} / minimo {p.minStock}
                      </div>
                      <div style={{ color: '#d4af37', marginTop: 6, fontWeight: 900 }}>
                        Fornitore: {p.supplier}
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
        borderColor: danger ? 'rgba(239,68,68,0.45)' : 'rgba(212,175,55,0.22)',
      }}
    >
      <div className="sp-muted">{title}</div>
      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 900,
          color: danger ? '#f87171' : '#d4af37',
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
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 24,
  flexWrap: 'wrap',
};

const eyebrow: React.CSSProperties = {
  color: '#d4af37',
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
  textTransform: 'uppercase',
};

const messageBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(139,92,246,0.14)',
  border: '1px solid rgba(139,92,246,0.32)',
  color: '#fff',
  fontWeight: 900,
};

const kpiGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 20,
};

const cardPad: React.CSSProperties = {
  padding: 24,
  marginBottom: 20,
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 18,
  flexWrap: 'wrap',
};

const greenKicker: React.CSSProperties = {
  color: '#22c55e',
  fontWeight: 900,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
};

const sectionTitle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#d4af37',
};

const grid4: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 0.8fr 1fr 180px',
  gap: 14,
  marginBottom: 14,
};

const mainGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.45fr 0.75fr',
  gap: 20,
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  color: '#22c55e',
  padding: 14,
  borderBottom: '1px solid rgba(255,255,255,0.12)',
};

const td: React.CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  verticalAlign: 'top',
};

const stockPill: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(34,197,94,0.32)',
  color: '#86efac',
  fontWeight: 900,
};

const dangerPill: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(239,68,68,0.14)',
  border: '1px solid rgba(239,68,68,0.32)',
  color: '#fca5a5',
  fontWeight: 900,
};

const miniBtn: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: 0,
  background: '#e8eef8',
  color: '#0f172a',
  fontWeight: 900,
};

const miniPurple: React.CSSProperties = {
  ...miniBtn,
  background: '#8b5cf6',
  color: '#fff',
};

const miniDanger: React.CSSProperties = {
  ...miniBtn,
  background: '#ef4444',
  color: '#fff',
};

const emptyBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#b8bfd0',
};

const alertRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(239,68,68,0.10)',
  border: '1px solid rgba(239,68,68,0.24)',
};