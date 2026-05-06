'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-production-6aa5.up.railway.app';


type SessionItem = {
  paidServices: string[];
  paidProducts: string[];
  giftServices: string[];
  giftProducts: string[];
};

type ActiveCard = {
  client: string;
  card: string;
  whatsapp: string;
  used: number;
  total: number;
};

type CatalogCard = {
  id?: string;
  name: string;
  price: number;
  sessionsCount: number;
  sessions: SessionItem[];
  increaseTotal: number;
};

type CardPdfTemplate = {
  logoUrl?: string | null;
  salonName: string;
  templateStyle: string;
  primaryColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  promiseText: string;
  valueText: string;
  bonusText: string;
  urgencyText: string;
  guaranteeText: string;
  ctaText: string;
  footerText: string;
  signature: string;
};

type ServicePrice = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  cost: number;
  active: boolean;
};

type ClientItem = {
  id: string;
  clientGlobal?: {
    id?: string;
    name?: string;
    phone?: string;
  };
  name?: string;
  phone?: string;
};

type StaffItem = {
  id: string;
  name: string;
};

const defaultCatalogCards: CatalogCard[] = [];

const defaultActiveCards: ActiveCard[] = [];

export default function MarketingPage() {
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClientTenantId, setSelectedClientTenantId] = useState('');
  const [staffMembers, setStaffMembers] = useState<StaffItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>(defaultCatalogCards);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editingCatalogIndex, setEditingCatalogIndex] = useState<number | null>(null);
  const [catalogName, setCatalogName] = useState('');
  const [catalogPrice, setCatalogPrice] = useState('');
  const [catalogSessionsCount, setCatalogSessionsCount] = useState(4);
  const [catalogSessions, setCatalogSessions] = useState<SessionItem[]>(
    Array.from({ length: 4 }).map(() => ({
      paidServices: [],
      paidProducts: [],
      giftServices: [],
      giftProducts: [],
    })),
  );
  const [catalogIncreaseInput, setCatalogIncreaseInput] = useState('');
  const [catalogIncreaseTotal, setCatalogIncreaseTotal] = useState(0);
  const [operator, setOperator] = useState('');
  const [frequency, setFrequency] = useState('Mensile (30 gg)');
  const [manualCardName, setManualCardName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [cardIncreaseInput, setCardIncreaseInput] = useState('');
  const [cardIncreaseTotal, setCardIncreaseTotal] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(4);
  const [sessions, setSessions] = useState<SessionItem[]>(
    Array.from({ length: 4 }).map(() => ({
      paidServices: [],
      paidProducts: [],
      giftServices: [],
      giftProducts: [],
    })),
  );
  const [activeCards, setActiveCards] = useState<ActiveCard[]>(defaultActiveCards);
  const [message, setMessage] = useState('');

  const [messageTemplates, setMessageTemplates] = useState({
    promo: [
      "Ciao {nome_cliente} 💛",
      "",
      "Abbiamo preparato una proposta speciale pensata per mantenere il risultato nel tempo:",
      "*{nome_card}*",
      "",
      "Prezzo card: € {prezzo_card}",
      "Sedute incluse: {sedute}",
      "Prezzo medio per seduta: € {prezzo_seduta}",
      "",
      "È un percorso pensato per darti continuità, ordine e valore, senza dover improvvisare ogni volta.",
      "",
      "Vuoi che ti blocchiamo questa possibilità?",
      "",
      "{firma}",
    ].join("\n"),
    confirm: [
      "Ciao {nome_cliente} 💛",
      "",
      "Ti confermiamo la tua card:",
      "*{nome_card}*",
      "",
      "Prezzo card: € {prezzo_card}",
      "Sedute incluse: {sedute}",
      "Prezzo medio per seduta: € {prezzo_seduta}",
      "",
      "Il tuo percorso è stato pensato per mantenere il risultato nel tempo e farti vivere ogni seduta con continuità.",
      "",
      "Ti aspettiamo in salone.",
      "",
      "{firma}",
    ].join("\n"),
  });
  const [previewCard, setPreviewCard] = useState<CatalogCard | null>(null);
  const [previewClientName, setPreviewClientName] = useState('');
  const [previewWhatsapp, setPreviewWhatsapp] = useState('');
  const [pdfTemplate, setPdfTemplate] = useState<CardPdfTemplate>({
    logoUrl: "/acquaviva-strategic-logo.png",
    salonName: "Acquaviva Strategic",
    templateStyle: "LUXURY_GOLD",
    primaryColor: "#080808",
    accentColor: "#d4af37",
    title: "Il tuo percorso bellezza personalizzato",
    subtitle: "Una card pensata per mantenere il risultato nel tempo.",
    promiseText: "Non è una semplice promozione: è un percorso guidato per farti restare sempre in ordine, senza improvvisare.",
    valueText: "Abbiamo racchiuso servizi, prodotti e bonus in una proposta chiara, comoda e ad alto valore.",
    bonusText: "I bonus inclusi sono pensati per aumentare il risultato e farti vivere un’esperienza più completa.",
    urgencyText: "I posti disponibili per questo percorso sono limitati per garantire continuità e qualità.",
    guaranteeText: "Ti guideremo passo dopo passo nella scelta più adatta ai tuoi capelli.",
    ctaText: "Blocca oggi il tuo percorso e programma subito le sedute.",
    footerText: "Card personale, non convertibile in denaro.",
    signature: "Il tuo salone di fiducia",
  });



  function getClientName(client: ClientItem) {
    return client.clientGlobal?.name || client.name || 'Cliente senza nome';
  }

  function getClientPhone(client: ClientItem) {
    return client.clientGlobal?.phone || client.phone || '';
  }

  async function loadClients() {
    try {
      const data = await marketingFetch('/clients');
      setClients(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length && !selectedClientTenantId) {
        const first = data[0];
        setSelectedClientTenantId(first.id);
        setClientName(getClientName(first));
        setWhatsapp(getClientPhone(first));
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`⚠️ ${err.message || 'Errore caricamento clienti'}`);
    }
  }

  async function loadStaffMembers() {
    try {
      const data = await marketingFetch('/staff');
      setStaffMembers(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length && !operator) {
        setOperator(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`⚠️ ${err.message || 'Errore caricamento staff'}`);
    }
  }

  function chooseClient(clientTenantId: string) {
    setSelectedClientTenantId(clientTenantId);

    const client = clients.find((item) => item.id === clientTenantId);

    if (!client) {
      setClientName('');
      setWhatsapp('');
      return;
    }

    setClientName(getClientName(client));
    setWhatsapp(getClientPhone(client));
  }

  async function loadServices() {
    try {
      const token =
        localStorage.getItem('salonpro_token') || localStorage.getItem('token');

      if (!token) return;

      const res = await fetch(`${API_URL}/service-prices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Errore caricamento listino servizi');
      }

      setServices(Array.isArray(data) ? data.filter((item) => item.active !== false) : []);
    } catch (err) {
      console.error(err);
      setMessage('⚠️ Errore caricamento listino servizi reali.');
    }
  }

  useEffect(() => {
    loadServices();
    loadCatalogCards();
    loadClients();
    loadStaffMembers();
    loadPdfTemplate();
  }, []);


  async function marketingFetch(path: string, options: RequestInit = {}) {
    const token =
      localStorage.getItem('salonpro_token') || localStorage.getItem('token');

    if (!token) {
      throw new Error('Token mancante');
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.message || text || 'Errore API');
    }

    return data;
  }


  async function loadPdfTemplate() {
    try {
      const data = await marketingFetch('/marketing/cards/template');

      if (data) {
        setPdfTemplate((prev) => ({
          ...prev,
          ...data,
          logoUrl: data.logoUrl || prev.logoUrl,
        }));

        setMessageTemplates((prev) => ({
          ...prev,
          promo: data.promoMessageTemplate || prev.promo,
          confirm: data.confirmMessageTemplate || prev.confirm,
        }));
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`⚠️ ${err.message || 'Errore caricamento template PDF Card'}`);
    }
  }

  async function loadCatalogCards() {
    try {
      const data = await marketingFetch('/marketing/cards');

      const list = Array.isArray(data)
        ? data.map((card) => ({
            id: card.id,
            name: card.name,
            price: Number(card.price || 0),
            sessionsCount: Number(card.sessionsCount || 4),
            sessions: Array.isArray(card.sessions) ? card.sessions : emptyCatalogSessions(Number(card.sessionsCount || 4)),
            increaseTotal: Number(card.increaseTotal || 0),
          }))
        : [];

      setCatalogCards(list);
    } catch (err: any) {
      console.error(err);
      setMessage(`⚠️ ${err.message || 'Errore caricamento card catalogo'}`);
    }
  }


  useEffect(() => {
    const saved = localStorage.getItem('salonpro_marketing_message_templates');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessageTemplates((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch {
        // Ignora configurazioni locali non valide
      }
    }
  }, []);

  const selectedCatalog = catalogCards.find((card) => card.name === selectedCard);

  const cardName = selectedCatalog?.name || manualCardName || 'Nuova Card';


  function getServiceValue(serviceName: string) {
    const service = services.find((item) => item.name === serviceName);
    return Number(service?.price || 0);
  }

  function getServiceCost(serviceName: string) {
    const service = services.find((item) => item.name === serviceName);
    return Number(service?.cost || 0);
  }



  const valueListino = useMemo(() => {
    return sessions.reduce((sum, session) => {
      let subtotal = 0;

      subtotal += session.paidServices.reduce((total, item) => total + getServiceValue(item), 0);
      subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);

      subtotal += session.giftServices.reduce((total, item) => total + getServiceValue(item), 0);
      subtotal += session.giftProducts.reduce((total, item) => total + productValue(item), 0);

      return sum + subtotal;
    }, 0);
  }, [sessions]);

  const calculatedCardPrice = useMemo(() => {
    return sessions.reduce((sum, session) => {
      let subtotal = 0;

      subtotal += session.paidServices.reduce((total, item) => total + getServiceValue(item), 0);
      subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);

      subtotal += session.giftServices.reduce((total, item) => total + getServiceCost(item), 0);
      subtotal += session.giftProducts.reduce((total, item) => total + productCost(item), 0);

      return sum + subtotal;
    }, 0);
  }, [sessions]);

  const cardPrice = calculatedCardPrice + cardIncreaseTotal;
  const convenience = Math.max(0, valueListino - cardPrice);


  function addCardIncrease() {
    const amount = Number(String(cardIncreaseInput || 0).replace(',', '.'));

    if (!amount || amount <= 0) {
      setMessage('Inserisci un valore valido per aumentare il prezzo card.');
      return;
    }

    setCardIncreaseTotal((prev) => prev + amount);
    setCardIncreaseInput('');
    setMessage(`✅ Prezzo card aumentato di € ${amount.toFixed(2)}.`);
  }


  function emptyCatalogSessions(count = 4) {
    return Array.from({ length: count }).map(() => ({
      paidServices: [],
      paidProducts: [],
      giftServices: [],
      giftProducts: [],
    }));
  }

  function openCreateCatalogCard() {
    const cleanSessions = emptyCatalogSessions(4);

    setEditingCatalogIndex(null);
    setCatalogName('');
    setCatalogPrice('');
    setCatalogSessionsCount(4);
    setCatalogSessions(cleanSessions);
    setCatalogIncreaseInput('');
    setCatalogIncreaseTotal(0);
    setCatalogOpen(true);
  }

  function openEditCatalogCard(index: number) {
    const card = catalogCards[index];
    const savedSessions = card.sessions?.length ? card.sessions : emptyCatalogSessions(card.sessionsCount || 4);

    setEditingCatalogIndex(index);
    setCatalogName(card.name);
    setCatalogPrice(String(card.price));
    setCatalogSessionsCount(card.sessionsCount || savedSessions.length || 4);
    setCatalogSessions(savedSessions);
    setCatalogIncreaseInput('');
    setCatalogIncreaseTotal(card.increaseTotal || 0);
    setCatalogOpen(true);
  }

  function setCatalogSessionCount(value: number) {
    setCatalogSessionsCount(value);
    setCatalogSessions((prev) => {
      const next = [...prev];

      while (next.length < value) {
        next.push({
          paidServices: [],
          paidProducts: [],
          giftServices: [],
          giftProducts: [],
        });
      }

      return next.slice(0, value);
    });
  }


  function copyCatalogSessionToAll(index: number) {
    setCatalogSessions((prev) => {
      const source = prev[index];

      if (!source) return prev;

      return prev.map(() => ({
        paidServices: [...(source.paidServices || [])],
        paidProducts: [...(source.paidProducts || [])],
        giftServices: [...(source.giftServices || [])],
        giftProducts: [...(source.giftProducts || [])],
      }));
    });

    setMessage(`✅ Seduta catalogo ${index + 1} copiata su tutte.`);
  }


  function addCatalogSessionValue(index: number, key: keyof SessionItem, value: string) {
    if (!value) return;

    setCatalogSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = Array.isArray(session[key]) ? (session[key] as string[]) : [];

        return {
          ...session,
          [key]: current.includes(value) ? current : [...current, value],
        };
      }),
    );
  }

  function removeCatalogSessionValue(index: number, key: keyof SessionItem, value: string) {
    setCatalogSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = Array.isArray(session[key]) ? (session[key] as string[]) : [];

        return {
          ...session,
          [key]: current.filter((item) => item !== value),
        };
      }),
    );
  }

  function updateCatalogSession(index: number, key: keyof SessionItem, value: string[]) {
    setCatalogSessions((prev) =>
      prev.map((session, i) =>
        i === index
          ? {
              ...session,
              [key]: value,
            }
          : session,
      ),
    );
  }

  const catalogValueListino = catalogSessions.reduce((sum, session) => {
    let subtotal = 0;

    subtotal += session.paidServices.reduce((total, item) => total + getServiceValue(item), 0);
    subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);
    subtotal += session.giftServices.reduce((total, item) => total + getServiceValue(item), 0);
    subtotal += session.giftProducts.reduce((total, item) => total + productValue(item), 0);

    return sum + subtotal;
  }, 0);

  const catalogCalculatedPrice = catalogSessions.reduce((sum, session) => {
    let subtotal = 0;

    subtotal += session.paidServices.reduce((total, item) => total + getServiceValue(item), 0);
    subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);
    subtotal += session.giftServices.reduce((total, item) => total + getServiceCost(item), 0);
    subtotal += session.giftProducts.reduce((total, item) => total + productCost(item), 0);

    return sum + subtotal;
  }, 0);

  const catalogFinalPrice = catalogCalculatedPrice + catalogIncreaseTotal;
  const catalogConvenience = Math.max(0, catalogValueListino - Number(String(catalogPrice || catalogFinalPrice || 0).replace(',', '.')));

  function addCatalogIncrease() {
    const amount = Number(String(catalogIncreaseInput || 0).replace(',', '.'));

    if (!amount || amount <= 0) {
      setMessage('Inserisci un valore valido per aumentare il prezzo della card catalogo.');
      return;
    }

    setCatalogIncreaseTotal((prev) => prev + amount);
    setCatalogIncreaseInput('');
  }

  function useCalculatedCatalogPrice() {
    setCatalogPrice(String(catalogFinalPrice.toFixed(2)));
  }

  async function saveCatalogCard() {
    const name = catalogName.trim();
    const price = Number(String(catalogPrice || catalogFinalPrice || 0).replace(',', '.'));

    if (!name) {
      setMessage('Inserisci il nome della card.');
      return;
    }

    if (!price || price <= 0) {
      setMessage('Inserisci un prezzo valido oppure calcolalo dal carrello.');
      return;
    }

    const payload = {
      name,
      price,
      sessionsCount: catalogSessionsCount,
      sessions: catalogSessions,
      increaseTotal: catalogIncreaseTotal,
    };

    try {
      const current = editingCatalogIndex === null ? null : catalogCards[editingCatalogIndex];

      if (current?.id) {
        await marketingFetch(`/marketing/cards/${current.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await marketingFetch('/marketing/cards', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      await loadCatalogCards();

      setSelectedCard(name);
      setManualCardName('');
      setManualPrice('');
      setCatalogOpen(false);
      setEditingCatalogIndex(null);
      setCatalogName('');
      setCatalogPrice('');
      setCatalogSessionsCount(4);
      setCatalogSessions(emptyCatalogSessions(4));
      setCatalogIncreaseInput('');
      setCatalogIncreaseTotal(0);
      setMessage(editingCatalogIndex === null ? '✅ Card catalogo salvata nel database.' : '✅ Card catalogo aggiornata nel database.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore salvataggio card catalogo'}`);
    }
  }

  async function deleteCatalogCard(index: number) {
    const card = catalogCards[index];
    const ok = confirm(`Vuoi eliminare "${card.name}" dal catalogo card?`);
    if (!ok) return;

    try {
      if (card.id) {
        await marketingFetch(`/marketing/cards/${card.id}`, {
          method: 'DELETE',
        });
      }

      await loadCatalogCards();

      if (selectedCard === card.name) {
        setSelectedCard('');
      }

      setMessage('✅ Card catalogo eliminata dal database.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore eliminazione card catalogo'}`);
    }
  }

  function chooseCatalogCard(cardName: string) {
    setSelectedCard(cardName);

    const card = catalogCards.find((item) => item.name === cardName);

    if (!card) return;

    setManualCardName('');
    setManualPrice(String(card.price));
    setSessionsCount(card.sessionsCount || 4);
    setSessions(
      card.sessions?.length
        ? card.sessions.map((session) => ({
            paidServices: [...(session.paidServices || [])],
            paidProducts: [...(session.paidProducts || [])],
            giftServices: [...(session.giftServices || [])],
            giftProducts: [...(session.giftProducts || [])],
          }))
        : emptyCatalogSessions(card.sessionsCount || 4),
    );
    setCardIncreaseTotal(card.increaseTotal || 0);
    setCardIncreaseInput('');
  }

  function setSessionCount(value: number) {
    setSessionsCount(value);
    setSessions((prev) => {
      const next = [...prev];

      while (next.length < value) {
        next.push({
          paidServices: [],
          paidProducts: [],
          giftServices: [],
          giftProducts: [],
        });
      }

      return next.slice(0, value);
    });
  }


  function copySessionToAll(index: number) {
    setSessions((prev) => {
      const source = prev[index];

      if (!source) return prev;

      return prev.map(() => ({
        paidServices: [...(source.paidServices || [])],
        paidProducts: [...(source.paidProducts || [])],
        giftServices: [...(source.giftServices || [])],
        giftProducts: [...(source.giftProducts || [])],
      }));
    });

    setMessage(`✅ Seduta ${index + 1} copiata su tutte le sedute.`);
  }


  function addSessionValue(index: number, key: keyof SessionItem, value: string) {
    if (!value) return;

    setSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = Array.isArray(session[key]) ? (session[key] as string[]) : [];

        return {
          ...session,
          [key]: current.includes(value) ? current : [...current, value],
        };
      }),
    );
  }

  function removeSessionValue(index: number, key: keyof SessionItem, value: string) {
    setSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = Array.isArray(session[key]) ? (session[key] as string[]) : [];

        return {
          ...session,
          [key]: current.filter((item) => item !== value),
        };
      }),
    );
  }

  function updateSession(index: number, key: keyof SessionItem, value: string[]) {
    setSessions((prev) =>
      prev.map((session, i) =>
        i === index
          ? {
              ...session,
              [key]: value,
            }
          : session,
      ),
    );
  }

  function autoDates() {
    const today = new Date();
    const gap = frequency.includes('15') ? 15 : frequency.includes('45') ? 45 : 30;

    return Array.from({ length: sessionsCount }).map((_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() + index * gap);
      return d.toISOString().slice(0, 10);
    });
  }

  const dates = autoDates();


  function updateMessageTemplate(field: 'promo' | 'confirm', value: string) {
    setMessageTemplates((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveMessageTemplates() {
    try {
      await marketingFetch('/marketing/cards/template', {
        method: 'POST',
        body: JSON.stringify({
          ...pdfTemplate,
          promoMessageTemplate: messageTemplates.promo,
          confirmMessageTemplate: messageTemplates.confirm,
        }),
      });

      localStorage.setItem('salonpro_marketing_message_templates', JSON.stringify(messageTemplates));
      setMessage('✅ Template messaggi WhatsApp salvati nel database del salone.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore salvataggio template messaggi WhatsApp'}`);
    }
  }

  async function resetMessageTemplates() {
    const ok = confirm('Vuoi ripristinare i messaggi WhatsApp standard?');
    if (!ok) return;

    const defaults = {
      promo: [
        "Ciao {nome_cliente} 💛",
        "",
        "Abbiamo preparato una proposta speciale pensata per mantenere il risultato nel tempo:",
        "*{nome_card}*",
        "",
        "Prezzo card: € {prezzo_card}",
        "Sedute incluse: {sedute}",
        "Prezzo medio per seduta: € {prezzo_seduta}",
        "",
        "È un percorso pensato per darti continuità, ordine e valore, senza dover improvvisare ogni volta.",
        "",
        "Vuoi che ti blocchiamo questa possibilità?",
        "",
        "{firma}",
      ].join("\\n"),
      confirm: [
        "Ciao {nome_cliente} 💛",
        "",
        "Ti confermiamo la tua card:",
        "*{nome_card}*",
        "",
        "Prezzo card: € {prezzo_card}",
        "Sedute incluse: {sedute}",
        "Prezzo medio per seduta: € {prezzo_seduta}",
        "",
        "Il tuo percorso è stato pensato per mantenere il risultato nel tempo e farti vivere ogni seduta con continuità.",
        "",
        "Ti aspettiamo in salone.",
        "",
        "{firma}",
      ].join("\\n"),
    };

    setMessageTemplates(defaults);
    localStorage.setItem('salonpro_marketing_message_templates', JSON.stringify(defaults));

    try {
      await marketingFetch('/marketing/cards/template', {
        method: 'POST',
        body: JSON.stringify({
          ...pdfTemplate,
          promoMessageTemplate: defaults.promo,
          confirmMessageTemplate: defaults.confirm,
        }),
      });

      setMessage('✅ Template messaggi WhatsApp ripristinati e salvati.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore ripristino template messaggi'}`);
    }
  }

  function applyWhatsappTemplate(template: string, card?: CatalogCard) {
    const activeCard = card || selectedCatalog || null;
    const sessionsTotal = activeCard?.sessionsCount || activeCard?.sessions?.length || sessionsCount || 1;
    const price = Number(activeCard?.price || cardPrice || 0);
    const pricePerSession = sessionsTotal > 0 ? price / sessionsTotal : price;

    return template
      .replaceAll('{nome_cliente}', clientName || previewClientName || 'cliente')
      .replaceAll('{nome_card}', activeCard?.name || cardName || 'Card percorso')
      .replaceAll('{prezzo_card}', price.toFixed(2))
      .replaceAll('{sedute}', String(sessionsTotal))
      .replaceAll('{prezzo_seduta}', pricePerSession.toFixed(2))
      .replaceAll('{salone}', pdfTemplate?.salonName || 'Acquaviva Strategic')
      .replaceAll('{firma}', pdfTemplate?.signature || 'Il tuo salone di fiducia');
  }

  function openPromoWhatsapp() {
    const phone = whatsapp.replace(/\D/g, '');

    if (!phone) {
      setMessage('Inserisci il numero WhatsApp cliente nel campo WhatsApp sopra.');
      return;
    }

    const phoneWithPrefix = phone.startsWith('39') ? phone : `39${phone}`;
    const text = applyWhatsappTemplate(messageTemplates.promo);

    window.open(`https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(text)}`, '_blank');
  }

  function copyPromoMessage() {
    const text = applyWhatsappTemplate(messageTemplates.promo);
    navigator.clipboard.writeText(text);
    setMessage('✅ Messaggio promozionale copiato.');
  }

  async function activateCard() {
    if (!selectedClientTenantId) {
      setMessage('Seleziona un cliente dalla lista.');
      return;
    }

    if (!clientName.trim()) {
      setMessage('Cliente non valido.');
      return;
    }

    const soldCard: CatalogCard = selectedCatalog
      ? selectedCatalog
      : {
          name: cardName,
          price: cardPrice,
          sessionsCount,
          sessions,
          increaseTotal: cardIncreaseTotal,
        };

    const newCard: ActiveCard = {
      client: clientName.trim(),
      card: soldCard.name,
      whatsapp: whatsapp.trim() || 'Non inserito',
      used: 0,
      total: sessionsCount,
    };

    setActiveCards((prev) => [newCard, ...prev]);

    const dateInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-card-date]'));
    const timeInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-card-time]'));

    let createdAppointments = 0;

    if (operator) {
      for (let index = 0; index < sessionsCount; index += 1) {
        const date = dateInputs[index]?.value;
        const time = timeInputs[index]?.value;

        if (!date || !time) continue;

        const session = sessions[index] || soldCard.sessions?.[index] || {
          paidServices: [],
          paidProducts: [],
          giftServices: [],
          giftProducts: [],
        };

        const appointmentServices = [
          ...(session.paidServices || []),
          ...(session.giftServices || []),
        ];

        try {
          await marketingFetch('/appointments', {
            method: 'POST',
            body: JSON.stringify({
              clientTenantId: selectedClientTenantId,
              staffId: operator,
              date,
              time,
              services: appointmentServices.length ? appointmentServices : [soldCard.name],
              note: `Percorso card: ${soldCard.name} - Seduta ${index + 1}/${sessionsCount}`,
            }),
          });

          createdAppointments += 1;
        } catch (err) {
          console.error(err);
        }
      }
    }

    setPreviewCard(soldCard);
    setPreviewClientName(clientName);
    setPreviewWhatsapp(whatsapp);

    setMessage(
      createdAppointments > 0
        ? `✅ Card attivata e ${createdAppointments} appuntamenti creati in agenda.`
        : '✅ Card attivata. Ora puoi inviare WhatsApp o stampare il PDF.'
    );
  }

  function useCard(index: number) {
    setActiveCards((prev) =>
      prev.map((card, i) =>
        i === index
          ? {
              ...card,
              used: Math.min(card.used + 1, card.total),
            }
          : card,
      ),
    );
  }

  function removeCard(index: number) {
    setActiveCards((prev) => prev.filter((_, i) => i !== index));
  }


  function openPreviewCard(card: CatalogCard) {
    setPreviewCard(card);
    setPreviewClientName(clientName);
    setPreviewWhatsapp(whatsapp);
  }

  function closePreviewCard() {
    setPreviewCard(null);
  }


  function buildPreviewWhatsappText(card: CatalogCard) {
    return applyWhatsappTemplate(messageTemplates.confirm, card);
  }

  function sendPreviewWhatsapp() {
    if (!previewCard) return;

    const phone = previewWhatsapp.replace(/\D/g, '');

    if (!phone) {
      setMessage('Inserisci il numero WhatsApp cliente nel popup anteprima.');
      return;
    }

    const text = buildPreviewWhatsappText(previewCard);
    const phoneWithPrefix = phone.startsWith('39') ? phone : `39${phone}`;

    window.open(`https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(text)}`, '_blank');
  }


  function printPreviewCard() {
    if (!previewCard) return;

    const esc = (value: any) =>
      String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const logoUrl = pdfTemplate.logoUrl || "/acquaviva-strategic-logo.png";
    const accent = pdfTemplate.accentColor || "#d4af37";
    const primary = pdfTemplate.primaryColor || "#080808";

    const sessions = previewCard.sessions || [];
    const sessionsTotal = previewCard.sessionsCount || sessions.length || 1;
    const cardPrice = Number(previewCard.price || 0);
    const pricePerSession = sessionsTotal > 0 ? cardPrice / sessionsTotal : cardPrice;

    const valueList = sessions.reduce((sum, session) => {
      const paidServices = (session.paidServices || []).reduce((t, item) => t + getServiceValue(item), 0);
      const paidProducts = (session.paidProducts || []).reduce((t, item) => t + productValue(item), 0);
      const giftServices = (session.giftServices || []).reduce((t, item) => t + getServiceValue(item), 0);
      const giftProducts = (session.giftProducts || []).reduce((t, item) => t + productValue(item), 0);

      return sum + paidServices + paidProducts + giftServices + giftProducts;
    }, 0);

    const saving = Math.max(0, valueList - cardPrice);

    const sessionsHtml = sessions
      .map((session, index) => {
        const paid = [
          ...(session.paidServices || []).map((item) => `Servizio: ${item}`),
          ...(session.paidProducts || []).map((item) => `Prodotto: ${item}`),
        ];

        const gifts = [
          ...(session.giftServices || []).map((item) => `Bonus servizio: ${item}`),
          ...(session.giftProducts || []).map((item) => `Bonus prodotto: ${item}`),
        ];

        return `
          <div class="session">
            <div class="session-left">
              <div class="session-number">Seduta ${index + 1}</div>
              <div class="session-price">Valore medio: € ${pricePerSession.toFixed(2)}</div>
            </div>

            <div class="session-content">
              <div class="session-main">${paid.length ? esc(paid.join(" · ")) : "Percorso da personalizzare in salone"}</div>
              ${gifts.length ? `<div class="session-gift">${esc(gifts.join(" · "))}</div>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    const templateClass =
      pdfTemplate.templateStyle === "DIRECT_RESPONSE"
        ? "direct"
        : pdfTemplate.templateStyle === "MINIMAL_PREMIUM"
          ? "minimal"
          : pdfTemplate.templateStyle === "GIFT_CARD"
            ? "gift"
            : "luxury";

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(previewCard.name)}</title>
  <style>
    @page { size: A4; margin: 12mm; }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #f2eee4;
      color: #111;
    }

    .sheet {
      min-height: calc(297mm - 24mm);
      background: ${templateClass === "minimal" ? "#ffffff" : primary};
      border-radius: 28px;
      overflow: hidden;
      border: 2px solid ${accent};
      position: relative;
    }

    .sheet::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at top left, ${accent}60, transparent 33%),
        radial-gradient(circle at bottom right, ${accent}40, transparent 34%);
      pointer-events: none;
    }

    .inner {
      position: relative;
      padding: 30px;
      color: ${templateClass === "minimal" ? "#111" : "#fff"};
    }

    .top {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 1px solid ${accent}88;
    }

    .logo {
      max-width: 185px;
      max-height: 80px;
      object-fit: contain;
    }

    .kicker {
      color: ${accent};
      font-weight: 950;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-size: 12px;
      margin-bottom: 10px;
    }

    h1 {
      margin: 0;
      font-size: 42px;
      line-height: 0.96;
      letter-spacing: -1.4px;
      max-width: 640px;
    }

    .subtitle {
      margin-top: 14px;
      font-size: 18px;
      line-height: 1.4;
      color: ${templateClass === "minimal" ? "#333" : "#f4ead0"};
      max-width: 740px;
      font-weight: 800;
    }

    .hero-offer {
      margin-top: 22px;
      padding: 24px;
      border-radius: 24px;
      background: ${templateClass === "minimal" ? "#f7f3ea" : "rgba(255,255,255,0.085)"};
      border: 1px solid ${accent}88;
    }

    .card-label {
      color: ${accent};
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 12px;
    }

    .card-title {
      margin-top: 8px;
      color: ${accent};
      font-size: 34px;
      line-height: 1.05;
      font-weight: 950;
    }

    .promise {
      margin-top: 16px;
      padding: 20px;
      border-radius: 20px;
      background: ${templateClass === "direct" ? "#fff3cd" : templateClass === "minimal" ? "#fafafa" : "rgba(212,175,55,0.13)"};
      color: ${templateClass === "direct" || templateClass === "minimal" ? "#111" : "#fff"};
      border: 1px solid ${accent}99;
      font-size: 18px;
      line-height: 1.46;
      font-weight: 900;
    }

    .numbers {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 18px;
    }

    .num {
      padding: 16px;
      border-radius: 18px;
      background: ${templateClass === "minimal" ? "#f7f7f7" : "rgba(255,255,255,0.075)"};
      border: 1px solid ${accent}55;
    }

    .num span {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: ${accent};
      font-weight: 950;
      margin-bottom: 8px;
    }

    .num strong {
      font-size: 25px;
      color: ${templateClass === "minimal" ? "#111" : "#fff"};
      letter-spacing: -0.5px;
    }

    .hook {
      margin-top: 18px;
      padding: 18px;
      border-radius: 20px;
      background: ${accent};
      color: #090909;
      font-size: 21px;
      line-height: 1.3;
      font-weight: 950;
      text-align: center;
    }

    .section {
      margin-top: 20px;
    }

    .section h3 {
      color: ${accent};
      margin: 0 0 10px;
      font-size: 21px;
      line-height: 1.1;
    }

    .text-box {
      padding: 16px;
      border-radius: 18px;
      border: 1px solid ${accent}55;
      background: ${templateClass === "minimal" ? "#fafafa" : "rgba(255,255,255,0.06)"};
      line-height: 1.5;
      font-weight: 800;
      color: ${templateClass === "minimal" ? "#222" : "#fff"};
    }

    .session {
      display: grid;
      grid-template-columns: 135px 1fr;
      gap: 12px;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid ${accent}44;
      background: ${templateClass === "minimal" ? "#f8f8f8" : "rgba(255,255,255,0.055)"};
      margin-top: 9px;
    }

    .session-number {
      color: ${accent};
      font-weight: 950;
      text-transform: uppercase;
      font-size: 13px;
    }

    .session-price {
      margin-top: 5px;
      font-size: 12px;
      line-height: 1.2;
      color: ${templateClass === "minimal" ? "#444" : "#f4ead0"};
      font-weight: 850;
    }

    .session-main {
      font-weight: 850;
      line-height: 1.4;
    }

    .session-gift {
      margin-top: 7px;
      color: ${accent};
      font-weight: 950;
      line-height: 1.4;
    }

    .closing {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 20px;
    }

    .cta {
      margin-top: 22px;
      padding: 22px;
      border-radius: 24px;
      background: ${accent};
      color: #090909;
      font-size: 23px;
      line-height: 1.32;
      font-weight: 950;
      text-align: center;
    }

    .footer {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      gap: 18px;
      font-size: 13px;
      color: ${templateClass === "minimal" ? "#444" : "#f4ead0"};
      border-top: 1px solid ${accent}55;
      padding-top: 14px;
    }

    @media print {
      body { background: #fff; }
      .sheet { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="sheet ${templateClass}">
    <div class="inner">
      <div class="top">
        <div>
          <div class="kicker">${esc(pdfTemplate.salonName)}</div>
          <h1>${esc(pdfTemplate.title)}</h1>
          <div class="subtitle">${esc(pdfTemplate.subtitle)}</div>
        </div>
        ${logoUrl ? `<img class="logo" src="${esc(logoUrl)}" />` : ""}
      </div>

      <div class="hero-offer">
        <div class="card-label">Percorso riservato</div>
        <div class="card-title">${esc(previewCard.name)}</div>
      </div>

      <div class="promise">${esc(pdfTemplate.promiseText)}</div>

      <div class="numbers">
        <div class="num">
          <span>Valore reale</span>
          <strong>€ ${valueList.toFixed(2)}</strong>
        </div>
        <div class="num">
          <span>Prezzo card</span>
          <strong>€ ${cardPrice.toFixed(2)}</strong>
        </div>
        <div class="num">
          <span>Prezzo/seduta</span>
          <strong>€ ${pricePerSession.toFixed(2)}</strong>
        </div>
        <div class="num">
          <span>Vantaggio</span>
          <strong>€ ${saving.toFixed(2)}</strong>
        </div>
      </div>

      <div class="hook">
        Non stai acquistando una singola seduta: stai bloccando un percorso pensato per mantenere il risultato nel tempo.
      </div>

      <div class="section">
        <h3>Perché questa card ha più valore di una promozione</h3>
        <div class="text-box">${esc(pdfTemplate.valueText)}</div>
      </div>

      <div class="section">
        <h3>Cosa include il percorso</h3>
        ${sessionsHtml || `<div class="text-box">Percorso configurabile in salone.</div>`}
      </div>

      <div class="closing">
        <div class="section">
          <h3>Bonus inclusi</h3>
          <div class="text-box">${esc(pdfTemplate.bonusText)}</div>
        </div>

        <div class="section">
          <h3>Perché conviene decidere ora</h3>
          <div class="text-box">${esc(pdfTemplate.urgencyText)}</div>
        </div>
      </div>

      <div class="section">
        <h3>La nostra rassicurazione</h3>
        <div class="text-box">${esc(pdfTemplate.guaranteeText)}</div>
      </div>

      <div class="cta">${esc(pdfTemplate.ctaText)}</div>

      <div class="footer">
        <div>${esc(pdfTemplate.footerText)}</div>
        <strong>${esc(pdfTemplate.signature)}</strong>
      </div>
    </div>
  </div>

  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>`;

    const win = window.open("", "_blank");

    if (!win) {
      setMessage("⚠️ Popup bloccato dal browser. Abilita i popup per stampare o salvare il PDF.");
      return;
    }

    win.document.write(html);
    win.document.close();
  }

  function resetCart() {
    setSessions(
      Array.from({ length: sessionsCount }).map(() => ({
        paidServices: [],
        paidProducts: [],
        giftServices: [],
        giftProducts: [],
      })),
    );
    setCardIncreaseInput('');
    setCardIncreaseTotal(0);
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={header}>
          <div>
            <div style={eyebrow}>Marketing & Card</div>
            <h1 className="sp-title">Percorsi fedeltà che vendono valore</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Crea card, sedute, omaggi e messaggi WhatsApp pronti per far tornare il cliente.
            </p>
          </div>

          <button className="sp-button-purple" onClick={openCreateCatalogCard}>
            + Crea/modifica catalogo card
          </button>
        </header>

        {message ? <div style={successBox}>{message}</div> : null}


        {previewCard ? (
          <div style={modalBackdrop}>
            <div style={previewModal}>
              <div style={catalogModalHeader}>
                <div>
                  <div style={greenKicker}>Anteprima card</div>
                  <h2 style={sectionTitle}>{previewCard.name}</h2>
                </div>

                <button style={closeButton} onClick={closePreviewCard}>
                  ×
                </button>
              </div>

              <div style={previewHero}>
                <div>
                  <div className="sp-muted">Prezzo</div>
                  <div style={{ color: '#d4af37', fontSize: 34, fontWeight: 900 }}>
                    € {Number(previewCard.price || 0).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="sp-muted">Sedute</div>
                  <div style={{ color: '#8b5cf6', fontSize: 34, fontWeight: 900 }}>
                    {previewCard.sessionsCount || previewCard.sessions?.length || 0}
                  </div>
                </div>

                <div>
                  <div className="sp-muted">Prezzo medio / seduta</div>
                  <div style={{ color: '#d4af37', fontSize: 34, fontWeight: 900 }}>
                    € {(Number(previewCard.price || 0) / Math.max(1, previewCard.sessionsCount || previewCard.sessions?.length || 1)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={grid2}>
                <input
                  className="sp-input"
                  placeholder="Nome cliente per WhatsApp opzionale"
                  value={previewClientName}
                  onChange={(e) => setPreviewClientName(e.target.value)}
                />

                <input
                  className="sp-input"
                  placeholder="Numero WhatsApp cliente"
                  value={previewWhatsapp}
                  onChange={(e) => setPreviewWhatsapp(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                {(previewCard.sessions || []).map((session, index) => {
                  const items = [
                    ...(session.paidServices || []).map((item) => `Servizio: ${item}`),
                    ...(session.paidProducts || []).map((item) => `Prodotto: ${item}`),
                    ...(session.giftServices || []).map((item) => `Omaggio servizio: ${item}`),
                    ...(session.giftProducts || []).map((item) => `Omaggio prodotto: ${item}`),
                  ];

                  return (
                    <div key={index} style={previewSession}>
                      <strong style={{ color: '#d4af37' }}>Seduta {index + 1}</strong>
                      <div className="sp-muted" style={{ marginTop: 6 }}>
                        {items.length ? items.join(' · ') : 'Da definire'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={previewActions}>
                <button className="sp-button-purple" onClick={printPreviewCard}>
                  Stampa / Salva PDF
                </button>

                <button style={smallPurple} onClick={sendPreviewWhatsapp}>
                  Invia WhatsApp
                </button>

                <button style={miniBtn} onClick={closePreviewCard}>
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        ) : null}


        {catalogOpen ? (
          <div style={modalBackdrop}>
            <div style={catalogModal}>
              <div style={catalogModalHeader}>
                <div>
                  <div style={greenKicker}>Catalogo card predefinite</div>
                  <h2 style={sectionTitle}>
                    {editingCatalogIndex === null ? 'Crea card predefinita' : 'Modifica card predefinita'}
                  </h2>
                </div>

                <button style={closeButton} onClick={() => setCatalogOpen(false)}>
                  ×
                </button>
              </div>

              <div style={infoBox}>
                Qui crei le card standard che vuoi riutilizzare dal menu “Scegli Card catalogo”.
                Ogni card può avere il proprio carrello percorso.
              </div>

              <div style={catalogFormGrid}>
                <input
                  className="sp-input"
                  placeholder="Nome card es. Colore Blindato"
                  value={catalogName}
                  onChange={(e) => setCatalogName(e.target.value)}
                />

                <input
                  className="sp-input"
                  placeholder="Prezzo card €"
                  value={catalogPrice}
                  onChange={(e) => setCatalogPrice(e.target.value)}
                />

                <button style={smallPurple} onClick={saveCatalogCard}>
                  {editingCatalogIndex === null ? 'Crea card' : 'Salva modifica'}
                </button>
              </div>

              <div style={catalogBuilderBox}>
                <div style={sectionHeader}>
                  <div>
                    <div style={greenKicker}>Carrello della card</div>
                    <h2 style={sectionTitle}>{catalogSessionsCount} sedute</h2>
                    <p className="sp-muted" style={{ marginTop: 6 }}>
                      Aggiungi più servizi e prodotti scegliendoli uno alla volta.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="sp-muted">Sedute:</span>

                    <select
                      className="sp-input"
                      style={{ width: 90 }}
                      value={catalogSessionsCount}
                      onChange={(e) => setCatalogSessionCount(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>

                    <div style={priceBadge}>Prezzo calcolato: € {catalogFinalPrice.toFixed(2)}</div>

                    <button style={smallPurple} onClick={useCalculatedCatalogPrice}>
                      Usa prezzo calcolato
                    </button>
                  </div>
                </div>

                <div style={catalogSessionsGrid}>
                  {catalogSessions.map((session, index) => (
                    <div key={index} style={sessionCard}>
                      <div style={sessionTitleRow}>
                        <h3 style={{ color: '#d4af37', margin: 0 }}>Seduta {index + 1}</h3>

                        <button
                          type="button"
                          style={copySessionButton}
                          onClick={() => copyCatalogSessionToAll(index)}
                        >
                          Copia su tutte
                        </button>
                      </div>

                      <select
                        className="sp-input"
                        value=""
                        onChange={(e) => addCatalogSessionValue(index, 'paidServices', e.target.value)}
                      >
                        <option value="">+ Servizio a pagamento...</option>
                        {services.length === 0 ? (
                          <option disabled>Nessun servizio nel listino reale</option>
                        ) : null}
                        {services.map((service) => (
                          <option key={service.id} value={service.name}>
                            {service.name} · € {Number(service.price || 0).toFixed(2)}
                          </option>
                        ))}
                      </select>

                      <SelectedItems
                        items={session.paidServices || []}
                        onRemove={(item) => removeCatalogSessionValue(index, 'paidServices', item)}
                      />

                      <select
                        className="sp-input"
                        style={{ marginTop: 10 }}
                        value=""
                        onChange={(e) => addCatalogSessionValue(index, 'paidProducts', e.target.value)}
                      >
                        <option value="">+ Prodotto a pagamento...</option>
                        <option>Shampoo specifico</option>
                        <option>Maschera nutriente</option>
                        <option>Siero gloss</option>
                      </select>

                      <SelectedItems
                        items={session.paidProducts || []}
                        onRemove={(item) => removeCatalogSessionValue(index, 'paidProducts', item)}
                      />

                      <select
                        className="sp-input"
                        style={{ marginTop: 10 }}
                        value=""
                        onChange={(e) => addCatalogSessionValue(index, 'giftServices', e.target.value)}
                      >
                        <option value="">+ Servizio in omaggio...</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.name}>
                            {service.name} · € {Number(service.price || 0).toFixed(2)}
                          </option>
                        ))}
                      </select>

                      <SelectedItems
                        items={session.giftServices || []}
                        onRemove={(item) => removeCatalogSessionValue(index, 'giftServices', item)}
                      />

                      <select
                        className="sp-input"
                        style={{ marginTop: 10 }}
                        value=""
                        onChange={(e) => addCatalogSessionValue(index, 'giftProducts', e.target.value)}
                      >
                        <option value="">+ Prodotto omaggio...</option>
                        <option>Mini shampoo</option>
                        <option>Fiala trattamento</option>
                        <option>Campione premium</option>
                      </select>

                      <SelectedItems
                        items={session.giftProducts || []}
                        onRemove={(item) => removeCatalogSessionValue(index, 'giftProducts', item)}
                      />
                    </div>
                  ))}
                </div>

                <div style={increaseBox}>
                  <div>
                    <div style={greenKicker}>Aumento prezzo card</div>
                    <div className="sp-muted" style={{ marginTop: 4 }}>
                      Aggiungi un extra al prezzo calcolato della card.
                    </div>
                  </div>

                  <input
                    className="sp-input"
                    placeholder="Valore aumento €"
                    value={catalogIncreaseInput}
                    onChange={(e) => setCatalogIncreaseInput(e.target.value)}
                  />

                  <button style={smallPurple} onClick={addCatalogIncrease}>
                    Aggiungi
                  </button>

                  <button
                    style={miniBtn}
                    onClick={() => {
                      setCatalogIncreaseTotal(0);
                      setCatalogIncreaseInput('');
                    }}
                  >
                    Azzera
                  </button>
                </div>

                <div style={summaryGrid}>
                  <Summary label="Valore a listino" value={`€ ${catalogValueListino.toFixed(2)}`} />
                  <Summary label="Prezzo calcolato" value={`€ ${catalogFinalPrice.toFixed(2)}`} />
                  <Summary label="Convenienza Cliente" value={`€ ${catalogConvenience.toFixed(2)}`} />
                  <Summary label="Sedute" value={String(catalogSessionsCount)} />
                </div>
              </div>

              <div style={{ marginTop: 20, overflowX: 'auto' }}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Nome card</th>
                      <th style={th}>Prezzo</th>
                      <th style={th}>Azioni</th>
                    </tr>
                  </thead>

                  <tbody>
                    {catalogCards.map((card, index) => (
                      <tr key={`${card.name}-${index}`}>
                        <td style={td}>{card.name}</td>
                        <td style={td}>€ {card.price.toFixed(2)}</td>
                        <td style={td}>
                          <button style={miniPurple} onClick={() => openEditCatalogCard(index)}>
                            Modifica
                          </button>{' '}
                          <button style={miniDanger} onClick={() => deleteCatalogCard(index)}>
                            Elimina
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Fissa appuntamenti card</div>
              <h2 style={sectionTitle}>Assegnazione percorso cliente</h2>
            </div>

            <div style={goldBadge}>Percorso consigliato</div>
          </div>

          <div style={infoBox}>
            <strong>Procedura strategica:</strong> scegli il cliente, collega la card e prepara subito
            le sedute del percorso.
          </div>

          <div style={grid4}>
            <select
              className="sp-input"
              value={selectedClientTenantId}
              onChange={(e) => chooseClient(e.target.value)}
            >
              <option value="">Seleziona cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {getClientName(client)} — {getClientPhone(client) || 'senza telefono'}
                </option>
              ))}
            </select>

            <input
              className="sp-input"
              placeholder="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />

            <select
              className="sp-input"
              value={selectedCard}
              onChange={(e) => chooseCatalogCard(e.target.value)}
            >
              <option value="">Scegli Card catalogo...</option>
              {catalogCards.map((card) => (
                <option key={card.name} value={card.name}>
                  {card.name} — € {card.price.toFixed(2)}
                </option>
              ))}
            </select>

            <select
              className="sp-input"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            >
              <option value="">Operatore percorso</option>
              {staffMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={label}>Frequenza percorso</label>
            <select
              className="sp-input"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option>Mensile (30 gg)</option>
              <option>Quindicinale (15 gg)</option>
              <option>Ogni 45 giorni</option>
            </select>
          </div>

          <div style={grid2}>
            <input
              className="sp-input"
              placeholder="Nuova Card: nome"
              value={manualCardName}
              onChange={(e) => setManualCardName(e.target.value)}
            />

            <input
              className="sp-input"
              placeholder="Prezzo Card manuale €"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
            />
          </div>

          <div style={datesGrid}>
            {Array.from({ length: sessionsCount }).map((_, i) => (
              <div key={i}>
                <label style={label}>{i + 1}ª Data</label>
                <input
                  className="sp-input"
                  type="date"
                  defaultValue={dates[i]}
                  data-card-date={i}
                />
                <input
                  className="sp-input"
                  type="time"
                  style={{ marginTop: 8 }}
                  data-card-time={i}
                />
              </div>
            ))}
          </div>
        </section>




        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Carrello percorso</div>
              <h2 style={sectionTitle}>{sessionsCount} sedute</h2>
              <p className="sp-muted" style={{ marginTop: 6 }}>
                Aggiungi più servizi e prodotti scegliendoli uno alla volta.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="sp-muted">Sedute:</span>
              <select
                className="sp-input"
                style={{ width: 90 }}
                value={sessionsCount}
                onChange={(e) => setSessionCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <div style={priceBadge}>Prezzo Card: € {cardPrice.toFixed(2)}</div>
              <div style={priceBadge}>Base: € {calculatedCardPrice.toFixed(2)}</div>
              <button style={smallPurple} onClick={resetCart}>Reset</button>
            </div>
          </div>

          <div style={sessionsGrid}>
            {sessions.map((session, index) => (
              <div key={index} style={sessionCard}>
                <div style={sessionTitleRow}>
                  <h3 style={{ color: '#d4af37', margin: 0 }}>Seduta {index + 1}</h3>
                  <button
                    type="button"
                    style={copySessionButton}
                    onClick={() => copySessionToAll(index)}
                  >
                    Copia su tutte
                  </button>
                </div>

                <select
                  className="sp-input"
                  value=""
                  onChange={(e) => addSessionValue(index, 'paidServices', e.target.value)}
                >
                  <option value="">+ Servizio a pagamento...</option>
                  {services.length === 0 ? (
                    <option disabled>Nessun servizio nel listino reale</option>
                  ) : null}
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name} · € {Number(service.price || 0).toFixed(2)}
                    </option>
                  ))}
                </select>

                <SelectedItems
                  items={session.paidServices || []}
                  onRemove={(item) => removeSessionValue(index, 'paidServices', item)}
                />

                <select
                  className="sp-input"
                  style={{ marginTop: 10 }}
                  value=""
                  onChange={(e) => addSessionValue(index, 'paidProducts', e.target.value)}
                >
                  <option value="">+ Prodotto a pagamento...</option>
                  <option>Shampoo specifico</option>
                  <option>Maschera nutriente</option>
                  <option>Siero gloss</option>
                </select>

                <SelectedItems
                  items={session.paidProducts || []}
                  onRemove={(item) => removeSessionValue(index, 'paidProducts', item)}
                />

                <select
                  className="sp-input"
                  style={{ marginTop: 10 }}
                  value=""
                  onChange={(e) => addSessionValue(index, 'giftServices', e.target.value)}
                >
                  <option value="">+ Servizio in omaggio...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name} · € {Number(service.price || 0).toFixed(2)}
                    </option>
                  ))}
                </select>

                <SelectedItems
                  items={session.giftServices || []}
                  onRemove={(item) => removeSessionValue(index, 'giftServices', item)}
                />

                <select
                  className="sp-input"
                  style={{ marginTop: 10 }}
                  value=""
                  onChange={(e) => addSessionValue(index, 'giftProducts', e.target.value)}
                >
                  <option value="">+ Prodotto omaggio...</option>
                  <option>Mini shampoo</option>
                  <option>Fiala trattamento</option>
                  <option>Campione premium</option>
                </select>

                <SelectedItems
                  items={session.giftProducts || []}
                  onRemove={(item) => removeSessionValue(index, 'giftProducts', item)}
                />
              </div>
            ))}
          </div>

          <div style={increaseBox}>
            <div>
              <div style={greenKicker}>Aumento prezzo card</div>
              <div className="sp-muted" style={{ marginTop: 4 }}>
                Usa questo campo per alzare manualmente il prezzo finale della card.
              </div>
            </div>

            <input
              className="sp-input"
              placeholder="Valore aumento €"
              value={cardIncreaseInput}
              onChange={(e) => setCardIncreaseInput(e.target.value)}
            />

            <button style={smallPurple} onClick={addCardIncrease}>
              Aggiungi al prezzo card
            </button>

            <button
              style={miniBtn}
              onClick={() => {
                setCardIncreaseTotal(0);
                setCardIncreaseInput('');
              }}
            >
              Azzera aumento
            </button>
          </div>

          <div style={summaryGrid}>
            <Summary label="Valore a listino" value={`€ ${valueListino.toFixed(2)}`} />
            <Summary label="Prezzo Card" value={`€ ${cardPrice.toFixed(2)}`} />
            <Summary label="Convenienza Cliente" value={`€ ${convenience.toFixed(2)}`} />
            <Summary label="Sedute" value={String(sessionsCount)} />
          </div>

          {valueListino === 0 ? (
            <div style={warningBox}>
              💡 Aggiungi almeno un servizio o prodotto per calcolare il valore del percorso.
            </div>
          ) : null}

          <button className="sp-button-purple" style={{ width: '100%', marginTop: 18 }} onClick={activateCard}>
            Attiva asset card salva percorso + stampa ✅
          </button>
        </section>

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Card attive clienti</div>
              <h2 style={sectionTitle}>Percorsi già venduti</h2>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Cliente</th>
                  <th style={th}>Card</th>
                  <th style={th}>WhatsApp</th>
                  <th style={th}>Avanzamento</th>
                  <th style={th}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {activeCards.map((card, index) => (
                  <tr key={`${card.client}-${index}`}>
                    <td style={td}>{card.client}</td>
                    <td style={td}>{card.card}</td>
                    <td style={td}>{card.whatsapp}</td>
                    <td style={td}>
                      <div style={progressWrap}>
                        <div
                          style={{
                            ...progressBar,
                            width: `${(card.used / card.total) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="sp-muted" style={{ marginTop: 5 }}>
                        {card.used}/{card.total} usate
                      </div>
                    </td>
                    <td style={td}>
                      <button
                        style={miniBtn}
                        onClick={() => {
                          const found = catalogCards.find((item) => item.name === card.card);
                          const fallback: CatalogCard = {
                            name: card.card,
                            price: 0,
                            sessionsCount: card.total,
                            sessions: [],
                            increaseTotal: 0,
                          };

                          setPreviewCard(found || fallback);
                          setPreviewClientName(card.client);
                          setPreviewWhatsapp(card.whatsapp);
                        }}
                      >
                        👁 Stampa
                      </button>{' '}
                      <button style={miniPurple} onClick={() => useCard(index)}>✅ Usa</button>{' '}
                      <button style={miniDanger} onClick={() => removeCard(index)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Catalogo solo lettura</div>
              <h2 style={sectionTitle}>Card predefinite da mostrare, stampare o salvare PDF</h2>
            </div>
          </div>

          {catalogCards.length === 0 ? (
            <div style={warningBox}>
              💡 Nessuna card predefinita presente. Creale dal pulsante “+ Crea/modifica catalogo card” in alto.
            </div>
          ) : (
            <div style={cardLibraryGrid}>
              {catalogCards.map((card, index) => (
                <button
                  key={`${card.name}-${index}`}
                  type="button"
                  style={libraryCard}
                  onClick={() => openPreviewCard(card)}
                >
                  <div style={greenKicker}>Card percorso</div>
                  <h3 style={{ color: '#d4af37', margin: '8px 0 10px', fontSize: 22 }}>
                    {card.name}
                  </h3>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>
                    € {Number(card.price || 0).toFixed(2)}
                  </div>
                  <div className="sp-muted" style={{ marginTop: 8 }}>
                    {card.sessionsCount || card.sessions?.length || 0} sedute · clicca per vedere/stampare
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Configurazione messaggi WhatsApp</div>
              <h2 style={sectionTitle}>Template messaggi promozionali e conferma card</h2>
            </div>

            <div style={goldBadge}>Variabili automatiche</div>
          </div>

          <div style={infoBox}>
            Puoi usare queste variabili nei messaggi:
            <strong> {"{nome_cliente}"} {"{nome_card}"} {"{prezzo_card}"} {"{sedute}"} {"{prezzo_seduta}"} {"{salone}"} {"{firma}"}</strong>
          </div>


          <div style={messageTemplateGrid}>
            <div>
              <label style={label}>Messaggio promozionale</label>
              <textarea
                className="sp-input"
                rows={12}
                value={messageTemplates.promo}
                onChange={(e) => updateMessageTemplate('promo', e.target.value)}
              />

            </div>

            <div>
              <label style={label}>Messaggio conferma card</label>
              <textarea
                className="sp-input"
                rows={12}
                value={messageTemplates.confirm}
                onChange={(e) => updateMessageTemplate('confirm', e.target.value)}
              />

              <div className="sp-muted" style={{ marginTop: 12 }}>
                Questo messaggio viene usato nel punto in cui confermi o invii una card al cliente.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="sp-button-purple" onClick={saveMessageTemplates}>
              Salva template messaggi
            </button>

            <button style={miniBtn} onClick={resetMessageTemplates}>
              Ripristina standard
            </button>
          </div>
        </section>

      </div>
    </main>
  );
}

function serviceValue(service: string) {
  if (service.includes('Balayage')) return 80;
  if (service.includes('Colore')) return 42;
  if (service.includes('Taglio')) return 25;
  if (service.includes('Ricostruzione')) return 35;
  if (service.includes('Trattamento')) return 25;
  if (service.includes('Piega')) return 20;
  return 20;
}

function serviceCost(service: string) {
  return Math.round(serviceValue(service) * 0.35 * 100) / 100;
}

function productValue(product: string) {
  if (product.includes('Maschera')) return 22;
  if (product.includes('Siero')) return 20;
  if (product.includes('Shampoo')) return 18;
  if (product.includes('Fiala')) return 12;
  if (product.includes('Mini')) return 8;
  if (product.includes('Campione')) return 6;
  return 15;
}

function productCost(product: string) {
  if (product.includes('Maschera')) return 8;
  if (product.includes('Siero')) return 7;
  if (product.includes('Shampoo')) return 6;
  if (product.includes('Fiala')) return 4;
  if (product.includes('Mini')) return 3;
  if (product.includes('Campione')) return 2;
  return 5;
}


function SelectedItems({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (item: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div style={selectedItemsWrap}>
      {items.map((item) => (
        <span key={item} style={selectedItemChip}>
          {item}
          <button type="button" style={selectedItemRemove} onClick={() => onRemove(item)}>
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="sp-muted">{label}</div>
      <div style={{ color: '#8b5cf6', fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}


const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(8px)',
};

const catalogModal: React.CSSProperties = {
  width: 'min(1500px, 96vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 28,
  padding: 24,
  background: 'linear-gradient(180deg, rgba(25,25,25,0.98), rgba(8,8,8,0.98))',
  border: '1px solid rgba(212,175,55,0.28)',
  boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
};

const catalogModalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 18,
};

const closeButton: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 26,
  fontWeight: 900,
  cursor: 'pointer',
};

const catalogFormGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 0.6fr auto',
  gap: 12,
  alignItems: 'center',
};

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

const cardPad: React.CSSProperties = {
  padding: 24,
  marginBottom: 22,
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
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

const goldBadge: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 999,
  background: 'rgba(212,175,55,0.14)',
  border: '1px solid rgba(212,175,55,0.28)',
  color: '#d4af37',
  fontWeight: 900,
};

const successBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(34,197,94,0.12)',
  border: '1px solid rgba(34,197,94,0.32)',
  color: '#86efac',
  fontWeight: 900,
};

const infoBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 16,
};

const messageTemplateGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 18,
};

const grid4: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 0.8fr 1fr 1fr',
  gap: 14,
};

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 0.45fr',
  gap: 14,
  marginTop: 14,
};

const datesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 14,
  marginTop: 16,
};

const label: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  color: '#fff',
  fontWeight: 900,
};

const priceBadge: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(212,175,55,0.22)',
  color: '#d4af37',
  fontWeight: 900,
};

const smallPurple: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 0,
  background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  color: '#fff',
  fontWeight: 900,
};

const sessionsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 14,
};



const selectedItemsWrap: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
  marginBottom: 4,
};

const selectedItemChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(212,175,55,0.13)',
  border: '1px solid rgba(212,175,55,0.30)',
  color: '#f5d76e',
  fontSize: 12,
  fontWeight: 900,
};

const selectedItemRemove: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#fff',
  fontSize: 16,
  fontWeight: 900,
  cursor: 'pointer',
  lineHeight: 1,
};

const sessionTitleRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
};

const copySessionButton: React.CSSProperties = {
  border: '1px solid rgba(212,175,55,0.28)',
  borderRadius: 999,
  padding: '7px 10px',
  background: 'rgba(212,175,55,0.12)',
  color: '#f5d76e',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const sessionCard: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
};


const increaseBox: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.55fr auto auto',
  gap: 12,
  alignItems: 'center',
  marginTop: 22,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(212,175,55,0.22)',
};


const catalogBuilderBox: React.CSSProperties = {
  marginTop: 22,
  padding: 18,
  borderRadius: 22,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(212,175,55,0.22)',
};

const catalogSessionsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))',
  gap: 14,
};

const summaryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginTop: 22,
};

const warningBox: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 16,
  background: 'rgba(212,175,55,0.10)',
  border: '1px solid rgba(212,175,55,0.25)',
  color: '#f5d76e',
  fontWeight: 800,
};


const cardLibraryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))',
  gap: 16,
};

const libraryCard: React.CSSProperties = {
  textAlign: 'left',
  padding: 22,
  borderRadius: 22,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(212,175,55,0.24)',
  color: '#fff',
  cursor: 'pointer',
};

const previewModal: React.CSSProperties = {
  width: 'min(920px, 94vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 28,
  padding: 24,
  background: 'linear-gradient(180deg, rgba(25,25,25,0.98), rgba(8,8,8,0.98))',
  border: '1px solid rgba(212,175,55,0.28)',
  boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
};

const previewHero: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  padding: 18,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(212,175,55,0.22)',
};

const previewSession: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const previewActions: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 22,
};


const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const th: React.CSSProperties = {
  padding: 14,
  textAlign: 'left',
  color: '#22c55e',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const td: React.CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  fontWeight: 800,
};

const progressWrap: React.CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.10)',
  overflow: 'hidden',
};

const progressBar: React.CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(135deg,#8b5cf6,#d4af37)',
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