import { useEffect, useState } from 'react';
import api from '../api';

const EMPTY = {
  name: '', cas_number: '', category: '', unit: 'kg', unit_price: '',
  aliases: '', quantity_available: 0, reorder_level: 0, warehouse_location: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockDraft, setStockDraft] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const load = async () => {
    const { data } = await api.get('/products');
    setProducts(data.products);
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/products', {
        ...form,
        unit_price: Number(form.unit_price),
        quantity_available: Number(form.quantity_available) || 0,
        reorder_level: Number(form.reorder_level) || 0,
      });
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || (err.response?.data?.errors?.[0]?.msg) || 'Failed to create product');
    }
  };

  const startEditStock = (p) => {
    setEditingStockId(p.id);
    setStockDraft({
      quantity_available: p.inventory?.quantity_available ?? 0,
      reorder_level: p.inventory?.reorder_level ?? 0,
      warehouse_location: p.inventory?.warehouse_location ?? '',
    });
  };

  const saveStock = async (productId) => {
    await api.put(`/products/${productId}/inventory`, {
      quantity_available: Number(stockDraft.quantity_available),
      reorder_level: Number(stockDraft.reorder_level),
      warehouse_location: stockDraft.warehouse_location,
    });
    setEditingStockId(null);
    load();
  };

  const categories = ['ALL', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.cas_number && p.cas_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.aliases && p.aliases.toLowerCase().includes(searchQuery.toLowerCase()));

    if (categoryFilter === 'ALL') return matchesSearch;
    return matchesSearch && p.category === categoryFilter;
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Product Catalog &amp; Inventory</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Chemical specifications, CAS registries, real-time stock levels, and price books for RFQ matching.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showForm ? 'Cancel' : '+ New Product'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Add Catalog Product</h2>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-grid">
            <div><label>Chemical / Product Name *</label><input name="name" placeholder="e.g. Potassium Sorbate" value={form.name} onChange={handleChange} required /></div>
            <div><label>CAS Number (Exact Match)</label><input name="cas_number" value={form.cas_number} onChange={handleChange} placeholder="e.g. 24634-61-5" /></div>
            <div><label>Category</label><input name="category" placeholder="e.g. Preservative, Acidulant" value={form.category} onChange={handleChange} /></div>
            <div><label>Default Unit</label><input name="unit" placeholder="kg, MT, L" value={form.unit} onChange={handleChange} /></div>
            <div><label>Standard Unit Price (₹) *</label><input name="unit_price" type="number" step="0.01" min="0" placeholder="e.g. 310" value={form.unit_price} onChange={handleChange} required /></div>
            <div className="full-width"><label>Extraction Aliases (comma-separated, enables AI fuzzy matching)</label><input name="aliases" value={form.aliases} onChange={handleChange} placeholder="e.g. k sorbate, pot sorbate, potassium sorbic" /></div>
            <div><label>Initial Stock Quantity</label><input name="quantity_available" type="number" min="0" value={form.quantity_available} onChange={handleChange} /></div>
            <div><label>Reorder Alert Threshold</label><input name="reorder_level" type="number" min="0" value={form.reorder_level} onChange={handleChange} /></div>
            <div><label>Warehouse Storage Location</label><input name="warehouse_location" placeholder="e.g. WH-A, Rack 12" value={form.warehouse_location} onChange={handleChange} /></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn-primary" type="submit">Save Catalog Product</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>Live Catalog</h2>
            <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>
              {filteredProducts.length} items
            </span>
          </div>
        </div>

        {/* Search and Category filter */}
        <div className="search-filter-bar">
          <div className="search-input-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by product name, CAS number, or alias…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Product &amp; CAS #</th>
                <th>Category</th>
                <th>Standard Price</th>
                <th>Stock Level</th>
                <th>Reorder Level</th>
                <th>Warehouse</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const inv = p.inventory;
                const low = inv && inv.quantity_available <= inv.reorder_level;
                const outOfStock = inv && inv.quantity_available === 0;
                const editing = editingStockId === p.id;

                return (
                  <tr key={p.id} className={low ? 'row-alert' : ''}>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {p.cas_number ? `CAS: ${p.cas_number}` : 'No CAS assigned'}
                        {p.aliases && ` · [${p.aliases}]`}
                      </div>
                    </td>
                    <td>
                      <span className="status-chip" style={{ background: '#f8fafc', color: '#475569' }}>
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>₹{p.unit_price}</strong>
                      <span className="muted" style={{ fontSize: '0.8rem' }}> / {p.unit}</span>
                    </td>
                    <td>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          style={{ width: 100 }}
                          value={stockDraft.quantity_available}
                          onChange={(e) => setStockDraft({ ...stockDraft, quantity_available: e.target.value })}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700 }}>
                            {inv ? inv.quantity_available : 0} {p.unit}
                          </span>
                          {outOfStock ? (
                            <span className="status-chip" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', fontSize: '0.7rem' }}>
                              Out of stock
                            </span>
                          ) : low ? (
                            <span className="status-chip" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a', fontSize: '0.7rem' }}>
                              Low stock ⚠️
                            </span>
                          ) : (
                            <span className="status-chip" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontSize: '0.7rem' }}>
                              Healthy
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          style={{ width: 80 }}
                          value={stockDraft.reorder_level}
                          onChange={(e) => setStockDraft({ ...stockDraft, reorder_level: e.target.value })}
                        />
                      ) : (
                        <span className="muted">{inv ? `${inv.reorder_level} ${p.unit}` : '—'}</span>
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          style={{ width: 100 }}
                          value={stockDraft.warehouse_location}
                          onChange={(e) => setStockDraft({ ...stockDraft, warehouse_location: e.target.value })}
                        />
                      ) : (
                        <span className="status-chip" style={{ background: '#f1f5f9', color: '#475569' }}>
                          {inv?.warehouse_location || 'WH-General'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => saveStock(p.id)}>
                            Save
                          </button>
                          <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setEditingStockId(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.82rem' }} onClick={() => startEditStock(p)}>
                          Update Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
