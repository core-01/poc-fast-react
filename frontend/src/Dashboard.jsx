import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// ─── API HELPERS ─────────────────────────────────────────────────────────────
const api = {
  get: (path) => fetch(`${API_BASE}${path}`).then((r) => r.json()),
  post: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  put: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  delete: (path) => fetch(`${API_BASE}${path}`, { method: "DELETE" }).then((r) => r.json()),
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e1e2e 0%, #16162a 100%)",
      borderRadius: 14,
      padding: "22px 26px",
      borderLeft: `4px solid ${accent}`,
      flex: 1,
      minWidth: 170,
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      transition: "transform 0.15s",
      cursor: "default",
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>{label}</div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ color: "#555", fontSize: 12, marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: 0.4 }}>{icon}</div>
      </div>
    </div>
  );
}

function Badge({ status, type = "item" }) {
  const colorMap = {
    active:    { bg: "#22c55e22", color: "#22c55e", border: "#22c55e" },
    inactive:  { bg: "#ef444422", color: "#ef4444", border: "#ef4444" },
    pending:   { bg: "#f59e0b22", color: "#f59e0b", border: "#f59e0b" },
    completed: { bg: "#22c55e22", color: "#22c55e", border: "#22c55e" },
    cancelled: { bg: "#ef444422", color: "#ef4444", border: "#ef4444" },
  };
  const c = colorMap[status] || { bg: "#44444422", color: "#888", border: "#888" };
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 600,
    }}>{status}</span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#1e1e2e", borderRadius: 16, padding: 28, minWidth: 360, maxWidth: 480, width: "100%",
        boxShadow: "0 8px 48px rgba(0,0,0,0.6)", border: "1px solid #2a2a3e",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [items,   setItems]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("items");
  const [toast,   setToast]   = useState(null);
  const [modal,   setModal]   = useState(null); // { type: "addItem"|"addUser"|"addOrder" }
  const [busy,    setBusy]    = useState(false);

  // Form states
  const [newItem,  setNewItem]  = useState({ name: "", price: "", description: "" });
  const [newUser,  setNewUser]  = useState({ name: "", email: "" });
  const [newOrder, setNewOrder] = useState({ user_id: "", item_id: "", quantity: 1 });

  // ── DATA LOADING ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, i, u, o] = await Promise.all([
        api.get("/stats"),
        api.get("/items"),
        api.get("/users"),
        api.get("/orders"),
      ]);
      setStats(s);
      setItems(Array.isArray(i) ? i : []);
      setUsers(Array.isArray(u) ? u : []);
      setOrders(Array.isArray(o) ? o : []);
    } catch (err) {
      showToast("⚠️  Could not reach backend — is it running?", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── ITEM CRUD ──
  async function createItem() {
    if (!newItem.name || !newItem.price) return showToast("Name and price required", "error");
    setBusy(true);
    try {
      const created = await api.post("/items", {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        status: "active",
      });
      if (created.id) {
        setItems(p => [...p, created]);
        setNewItem({ name: "", price: "", description: "" });
        setModal(null);
        showToast(`✅ Item "${created.name}" created`);
        loadAll();
      } else {
        showToast("Failed to create item", "error");
      }
    } catch { showToast("Error creating item", "error"); }
    finally { setBusy(false); }
  }

  async function deleteItem(id) {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/items/${id}`);
      setItems(p => p.filter(i => i.id !== id));
      showToast("🗑 Item deleted");
      loadAll();
    } catch { showToast("Error deleting item", "error"); }
  }

  // ── USER CRUD ──
  async function createUser() {
    if (!newUser.name || !newUser.email) return showToast("Name and email required", "error");
    setBusy(true);
    try {
      const created = await api.post("/users", { ...newUser, status: "active" });
      if (created.id) {
        setUsers(p => [...p, created]);
        setNewUser({ name: "", email: "" });
        setModal(null);
        showToast(`✅ User "${created.name}" created`);
        loadAll();
      } else {
        showToast(created.detail || "Failed to create user", "error");
      }
    } catch { showToast("Error creating user", "error"); }
    finally { setBusy(false); }
  }

  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(p => p.filter(u => u.id !== id));
      showToast("🗑 User deleted");
      loadAll();
    } catch { showToast("Error deleting user", "error"); }
  }

  // ── ORDER CRUD ──
  async function createOrder() {
    if (!newOrder.user_id || !newOrder.item_id) return showToast("User and item required", "error");
    setBusy(true);
    try {
      const created = await api.post("/orders", {
        user_id: parseInt(newOrder.user_id),
        items: [{ item_id: parseInt(newOrder.item_id), quantity: parseInt(newOrder.quantity) || 1 }],
        status: "pending",
      });
      if (created.id) {
        setOrders(p => [created, ...p]);
        setNewOrder({ user_id: "", item_id: "", quantity: 1 });
        setModal(null);
        showToast(`✅ Order #${created.id} created`);
        loadAll();
      } else {
        showToast(created.detail || "Failed to create order", "error");
      }
    } catch { showToast("Error creating order", "error"); }
    finally { setBusy(false); }
  }

  async function deleteOrder(id) {
    if (!confirm("Delete this order?")) return;
    try {
      await api.delete(`/orders/${id}`);
      setOrders(p => p.filter(o => o.id !== id));
      showToast("🗑 Order deleted");
      loadAll();
    } catch { showToast("Error deleting order", "error"); }
  }

  // ── STYLES ──
  const s = {
    root:   { fontFamily: "'Inter', 'IBM Plex Mono', monospace", background: "#0f0f1a", minHeight: "100vh", color: "#cdd6f4" },
    nav:    { background: "#13131f", borderBottom: "1px solid #1e1e2e", padding: "0 32px", display: "flex", alignItems: "center", gap: 24, height: 60 },
    logo:   { fontSize: 16, fontWeight: 700, color: "#fff", marginRight: 24, display: "flex", alignItems: "center", gap: 8 },
    body:   { padding: "28px 32px" },
    statsRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 },
    card:   { background: "#1e1e2e", borderRadius: 14, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" },
    tabs:   { display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1e1e2e", paddingBottom: 0 },
    input:  { background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
    label:  { color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" },
    btn:    { background: "#7c3aed", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "inherit" },
    btnSm:  { background: "transparent", border: "1px solid #ef4444", borderRadius: 6, padding: "4px 12px", color: "#ef4444", cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
    btnGhost: { background: "transparent", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 16px", color: "#888", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
    table:  { width: "100%", borderCollapse: "collapse", fontSize: 14 },
    th:     { textAlign: "left", padding: "10px 16px", color: "#555", borderBottom: "1px solid #1e1e2e", fontWeight: 500, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
    td:     { padding: "13px 16px", borderBottom: "1px solid #16162a", verticalAlign: "middle" },
  };

  function tabBtn(name, label, count) {
    const active = tab === name;
    return (
      <button key={name} onClick={() => setTab(name)} style={{
        background: "none", border: "none", cursor: "pointer", padding: "14px 18px",
        color: active ? "#7c3aed" : "#888", fontWeight: active ? 700 : 400,
        borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
        fontSize: 14, fontFamily: "inherit", marginBottom: -1,
        transition: "color 0.15s",
      }}>
        {label} {count != null && <span style={{ background: "#2a2a3e", borderRadius: 20, padding: "1px 7px", fontSize: 11, marginLeft: 4 }}>{count}</span>}
      </button>
    );
  }

  return (
    <div style={s.root}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 2000,
          background: toast.type === "error" ? "#7f1d1d" : "#14532d",
          border: `1px solid ${toast.type === "error" ? "#ef4444" : "#22c55e"}`,
          color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 14,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)", maxWidth: 340,
        }}>{toast.msg}</div>
      )}

      {/* Modals */}
      {modal?.type === "addItem" && (
        <Modal title="➕ Add New Item" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={s.label}>Name *</label><input style={s.input} placeholder="Product name" value={newItem.name} onChange={e => setNewItem(p => ({...p, name: e.target.value}))} /></div>
            <div><label style={s.label}>Price *</label><input style={s.input} type="number" placeholder="0.00" value={newItem.price} onChange={e => setNewItem(p => ({...p, price: e.target.value}))} /></div>
            <div><label style={s.label}>Description</label><input style={s.input} placeholder="Optional description" value={newItem.description} onChange={e => setNewItem(p => ({...p, description: e.target.value}))} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button style={s.btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={s.btn} onClick={createItem} disabled={busy}>{busy ? "Saving…" : "Create Item"}</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === "addUser" && (
        <Modal title="👤 Add New User" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={s.label}>Name *</label><input style={s.input} placeholder="Full name" value={newUser.name} onChange={e => setNewUser(p => ({...p, name: e.target.value}))} /></div>
            <div><label style={s.label}>Email *</label><input style={s.input} type="email" placeholder="user@example.com" value={newUser.email} onChange={e => setNewUser(p => ({...p, email: e.target.value}))} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button style={s.btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={s.btn} onClick={createUser} disabled={busy}>{busy ? "Saving…" : "Create User"}</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === "addOrder" && (
        <Modal title="🛒 Create Order" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={s.label}>User *</label>
              <select style={{...s.input}} value={newOrder.user_id} onChange={e => setNewOrder(p => ({...p, user_id: e.target.value}))}>
                <option value="">Select a user…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Item *</label>
              <select style={{...s.input}} value={newOrder.item_id} onChange={e => setNewOrder(p => ({...p, item_id: e.target.value}))}>
                <option value="">Select an item…</option>
                {items.filter(i => i.status === "active").map(i => <option key={i.id} value={i.id}>{i.name} — ${Number(i.price).toFixed(2)}</option>)}
              </select>
            </div>
            <div><label style={s.label}>Quantity</label><input style={s.input} type="number" min="1" value={newOrder.quantity} onChange={e => setNewOrder(p => ({...p, quantity: e.target.value}))} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button style={s.btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={s.btn} onClick={createOrder} disabled={busy}>{busy ? "Saving…" : "Place Order"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.logo}><span>⚡</span><span>FastAPI Dashboard</span></div>
        <div style={{ flex: 1 }} />
        <span style={{ color: "#555", fontSize: 12 }}>{API_BASE}</span>
        <button style={s.btnGhost} onClick={loadAll} disabled={loading}>
          {loading ? "⏳" : "↻ Refresh"}
        </button>
      </nav>

      <div style={s.body}>
        {/* Stat Cards */}
        <div style={s.statsRow}>
          <StatCard label="Total Users"   value={stats?.users   ?? "—"} icon="👥" accent="#7c3aed" sub="registered accounts" />
          <StatCard label="Revenue"       value={stats ? `$${Number(stats.revenue).toLocaleString()}` : "—"} icon="💰" accent="#06b6d4" sub="all-time" />
          <StatCard label="Total Orders"  value={stats?.orders  ?? "—"} icon="📦" accent="#f59e0b" sub="placed orders" />
          <StatCard label="Monthly Growth" value={stats ? `${stats.growth > 0 ? "+" : ""}${stats.growth}%` : "—"} icon="📈" accent="#22c55e" sub="vs last month" />
        </div>

        {/* Main Card */}
        <div style={s.card}>
          {/* Tab Bar + Action Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
            <div style={s.tabs}>
              {tabBtn("items",  "Items",  items.length)}
              {tabBtn("users",  "Users",  users.length)}
              {tabBtn("orders", "Orders", orders.length)}
            </div>
            <div style={{ marginBottom: 4 }}>
              {tab === "items"  && <button style={s.btn} onClick={() => setModal({ type: "addItem"  })}>+ Add Item</button>}
              {tab === "users"  && <button style={s.btn} onClick={() => setModal({ type: "addUser"  })}>+ Add User</button>}
              {tab === "orders" && <button style={s.btn} onClick={() => setModal({ type: "addOrder" })}>+ New Order</button>}
            </div>
          </div>

          {loading ? (
            <div style={{ color: "#555", padding: "40px 0", textAlign: "center" }}>Loading…</div>
          ) : (
            <>
              {/* Items Tab */}
              {tab === "items" && (
                <table style={s.table}>
                  <thead>
                    <tr>{["#", "Name", "Description", "Status", "Price", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} style={{ transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "#16162a"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={{...s.td, color: "#555"}}>#{item.id}</td>
                        <td style={{...s.td, fontWeight: 600}}>{item.name}</td>
                        <td style={{...s.td, color: "#666", fontSize: 13}}>{item.description || "—"}</td>
                        <td style={s.td}><Badge status={item.status} /></td>
                        <td style={{...s.td, color: "#06b6d4", fontWeight: 600}}>${Number(item.price).toFixed(2)}</td>
                        <td style={s.td}><button style={s.btnSm} onClick={() => deleteItem(item.id)}>Delete</button></td>
                      </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan={6} style={{...s.td, color: "#555", textAlign: "center", padding: 32}}>No items yet. Add one!</td></tr>}
                  </tbody>
                </table>
              )}

              {/* Users Tab */}
              {tab === "users" && (
                <table style={s.table}>
                  <thead>
                    <tr>{["#", "Name", "Email", "Status", "Joined", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} onMouseEnter={e => e.currentTarget.style.background = "#16162a"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={{...s.td, color: "#555"}}>#{user.id}</td>
                        <td style={{...s.td, fontWeight: 600}}>{user.name}</td>
                        <td style={{...s.td, color: "#888"}}>{user.email}</td>
                        <td style={s.td}><Badge status={user.status} /></td>
                        <td style={{...s.td, color: "#555", fontSize: 13}}>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td style={s.td}><button style={s.btnSm} onClick={() => deleteUser(user.id)}>Delete</button></td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={6} style={{...s.td, color: "#555", textAlign: "center", padding: 32}}>No users yet. Add one!</td></tr>}
                  </tbody>
                </table>
              )}

              {/* Orders Tab */}
              {tab === "orders" && (
                <table style={s.table}>
                  <thead>
                    <tr>{["Order #", "User ID", "Items", "Total", "Status", "Date", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} onMouseEnter={e => e.currentTarget.style.background = "#16162a"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={{...s.td, color: "#7c3aed", fontWeight: 700}}>#{order.id}</td>
                        <td style={{...s.td, color: "#888"}}>User #{order.user_id}</td>
                        <td style={{...s.td, color: "#555", fontSize: 13}}>{order.order_items?.length ?? 0} item(s)</td>
                        <td style={{...s.td, color: "#22c55e", fontWeight: 600}}>${Number(order.total).toFixed(2)}</td>
                        <td style={s.td}><Badge status={order.status} /></td>
                        <td style={{...s.td, color: "#555", fontSize: 13}}>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td style={s.td}><button style={s.btnSm} onClick={() => deleteOrder(order.id)}>Delete</button></td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={7} style={{...s.td, color: "#555", textAlign: "center", padding: 32}}>No orders yet. Create one!</td></tr>}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: "center", color: "#333", fontSize: 12 }}>
          FastAPI Dashboard · React + Vite · FastAPI · PostgreSQL
          <span style={{ margin: "0 8px" }}>·</span>
          <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" style={{ color: "#7c3aed", textDecoration: "none" }}>API Docs →</a>
        </div>
      </div>
    </div>
  );
}
