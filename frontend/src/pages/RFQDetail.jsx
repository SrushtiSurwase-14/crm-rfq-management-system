import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

export default function RFQDetail() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [linkingCustomer, setLinkingCustomer] = useState(false);
  
  // Manual item addition state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    matched_product_id: '',
    requested_quantity: 100,
    unit: 'kg',
    raw_text: '',
  });

  const navigate = useNavigate();

  const load = async () => {
    try {
      const [rfqRes, productsRes, customersRes] = await Promise.all([
        api.get(`/rfqs/${id}`),
        api.get('/products'),
        api.get('/customers'),
      ]);
      setRfq(rfqRes.data.rfq);
      setProducts(productsRes.data.products);
      setCustomers(customersRes.data.customers);
      if (rfqRes.data.rfq.customer_id) {
        setSelectedCustomer(rfqRes.data.rfq.customer_id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load RFQ details');
    }
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [id]);

  const loadPreview = async () => {
    try {
      const { data } = await api.get(`/rfqs/${id}/inventory-preview`);
      setPreview(data.preview);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check inventory');
    }
  };

  const handleLinkCustomer = async () => {
    if (!selectedCustomer) return;
    setError(''); setInfo('');
    setLinkingCustomer(true);
    try {
      await api.patch(`/rfqs/${id}`, { customer_id: Number(selectedCustomer) });
      setInfo('Customer successfully linked to this RFQ!');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to link customer');
    } finally {
      setLinkingCustomer(false);
    }
  };

  const updateItem = async (itemId, patch) => {
    setError('');
    try {
      await api.put(`/rfqs/${id}/items/${itemId}`, patch);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this line item?')) return;
    try {
      await api.delete(`/rfqs/${id}/items/${itemId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleAddManualItem = async (e) => {
    e.preventDefault();
    if (!newItem.matched_product_id) {
      setError('Please select a product from the catalog');
      return;
    }
    const matchedProd = products.find((p) => p.id === Number(newItem.matched_product_id));
    try {
      await api.post(`/rfqs/${id}/items`, {
        matched_product_id: Number(newItem.matched_product_id),
        requested_quantity: Number(newItem.requested_quantity) || 1,
        unit: newItem.unit || matchedProd?.unit || 'kg',
        raw_text: newItem.raw_text || `${matchedProd?.name || 'Manual item'} - ${newItem.requested_quantity} ${newItem.unit}`,
      });
      setShowAddItem(false);
      setNewItem({ matched_product_id: '', requested_quantity: 100, unit: 'kg', raw_text: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add manual item');
    }
  };

  const handleGenerateQuote = async () => {
    setError(''); setInfo('');
    try {
      const { data } = await api.post(`/rfqs/${id}/generate-quote`);
      setInfo(`Quote #${data.quote.id} created — total ₹${data.quote.total_amount}`);
      navigate(`/quotes/${data.quote.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quote');
    }
  };

  if (!rfq) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="muted">Loading RFQ workspace details…</p>
        </div>
      </div>
    );
  }

  const matchedCount = (rfq.items || []).filter((i) => i.matched_product_id).length;
  const confPercent = Math.round((rfq.confidence_score || 0) * 100);
  const confColor = confPercent >= 70 ? '#10b981' : confPercent >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="container">
      <Link to="/rfqs" className="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to RFQ Inbox
      </Link>

      <div className="page-header">
        <div>
          <h1>
            RFQ #{rfq.id} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{rfq.subject && `— ${rfq.subject}`}</span>
          </h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Inbound Request for Quotation workspace with AI extraction, product linking, and quote generation.
          </p>
        </div>
        <StatusBadge value={rfq.status} />
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', padding: '14px 18px', marginTop: 12 }}>
          <p className="error" style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      {info && (
        <div className="card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', padding: '14px 18px', marginTop: 12 }}>
          <p className="success" style={{ margin: 0 }}>{info}</p>
        </div>
      )}

      {/* Details Card */}
      <div className="card">
        <div className="card-header">
          <h2>RFQ Overview &amp; Classification</h2>
          <span className="badge" style={{ background: '#f8fafc', color: 'var(--text-muted)', border: '1px solid #e2e8f0' }}>
            ID: #{rfq.id}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-item-box">
            <div className="detail-item-label">Customer Account</div>
            <div className="detail-item-value">
              {rfq.customer ? (
                <div>
                  <strong>{rfq.customer.name}</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>{rfq.customer.company}</div>
                </div>
              ) : (
                <span className="status-chip" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                  <span className="chip-dot" style={{ background: '#f59e0b' }} />
                  Unlinked Customer
                </span>
              )}
            </div>
          </div>

          <div className="detail-item-box">
            <div className="detail-item-label">Sender Email</div>
            <div className="detail-item-value" style={{ wordBreak: 'break-all' }}>
              {rfq.sender_email || '—'}
            </div>
          </div>

          <div className="detail-item-box">
            <div className="detail-item-label">Inbound Channel</div>
            <div className="detail-item-value" style={{ textTransform: 'capitalize' }}>
              {rfq.source_channel || 'Email'}
            </div>
          </div>

          <div className="detail-item-box">
            <div className="detail-item-label">AI Classification</div>
            <div className="detail-item-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{rfq.is_rfq ? 'RFQ Identified' : 'Non-RFQ Enquiry'}</span>
            </div>
            <div className="confidence-meter-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: confColor }}>
                <span>Confidence Score</span>
                <span>{confPercent}%</span>
              </div>
              <div className="confidence-bar-track">
                <div className="confidence-bar-fill" style={{ width: `${confPercent}%`, background: confColor }} />
              </div>
            </div>
          </div>
        </div>

        {/* Inline Customer Linking Feature (solves screenshot problem!) */}
        <div className="customer-linker-box">
          <div style={{ flex: 1, minWidth: 260 }}>
            <strong style={{ fontSize: '0.92rem', color: '#1e3a8a', display: 'block', marginBottom: 4 }}>
              {rfq.customer ? 'Change or Reassign Customer:' : 'Link Customer to this RFQ:'}
            </strong>
            <p className="muted" style={{ fontSize: '0.82rem', margin: 0 }}>
              Connect this RFQ to an existing customer record to unlock quotation generation.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              style={{ minWidth: 240 }}
            >
              <option value="">— Select Customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || 'Private'})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-primary"
              onClick={handleLinkCustomer}
              disabled={linkingCustomer || !selectedCustomer || Number(selectedCustomer) === rfq.customer_id}
            >
              {linkingCustomer ? 'Linking…' : rfq.customer ? 'Update Customer' : 'Link Customer'}
            </button>
          </div>
        </div>

        <details style={{ marginTop: 18 }}>
          <summary className="muted" style={{ cursor: 'pointer', fontWeight: 600 }}>
            ▶ View Raw Email / RFQ Content
          </summary>
          <pre className="raw-body">{rfq.raw_body}</pre>
        </details>
      </div>

      {/* Extracted Line Items Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>Extracted Line Items ({matchedCount}/{(rfq.items || []).length} Matched)</h2>
            {matchedCount > 0 && (
              <span className="badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                Catalog Matched
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setShowAddItem(!showAddItem)}>
              {showAddItem ? 'Cancel Add' : '+ Add Manual Item'}
            </button>
            <button className="btn-secondary" onClick={loadPreview}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              </svg>
              Run Live Inventory Check
            </button>
          </div>
        </div>

        {/* Manual Item Add Form */}
        {showAddItem && (
          <form onSubmit={handleAddManualItem} style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Add Line Item to this RFQ</h3>
            <div className="form-grid">
              <div>
                <label>Select Catalog Product *</label>
                <select
                  value={newItem.matched_product_id}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === Number(e.target.value));
                    setNewItem({
                      ...newItem,
                      matched_product_id: e.target.value,
                      unit: prod?.unit || newItem.unit,
                    });
                  }}
                  required
                >
                  <option value="">— Select Product from Catalog —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.unit_price}/{p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={newItem.requested_quantity}
                  onChange={(e) => setNewItem({ ...newItem, requested_quantity: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Unit</label>
                <input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="kg, MT, L, etc."
                />
              </div>

              <div>
                <label>Raw Reference Note</label>
                <input
                  value={newItem.raw_text}
                  onChange={(e) => setNewItem({ ...newItem, raw_text: e.target.value })}
                  placeholder="e.g. Added via phone / manual review"
                />
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary">Add Item to RFQ</button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddItem(false)}>Cancel</button>
            </div>
          </form>
        )}

        {/* Empty state message with quick helper */}
        {(rfq.items || []).length === 0 && (
          <div className="empty-items-alert-box">
            <h3 style={{ color: '#b45309', fontSize: '1.05rem', marginBottom: 6 }}>
              No Line Items Detected in this Inbound Text
            </h3>
            <p className="muted" style={{ maxWidth: 600, margin: '0 auto 14px' }}>
              Because this enquiry was either brief, conversational, or had no clear product quantities, our AI extraction did not capture products automatically.
            </p>
            <button className="btn-primary" onClick={() => setShowAddItem(true)}>
              + Add Catalog Item Manually
            </button>
          </div>
        )}

        {/* Table of items */}
        {(rfq.items || []).length > 0 && (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Original Text Snippet</th>
                  <th>Matched Product Catalog</th>
                  <th>Match Confidence</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Stock Availability</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rfq.items.map((item) => {
                  const previewRow = preview?.find((p) => p.item_id === item.id);
                  const itemConf = Math.round((item.match_confidence || 0) * 100);

                  return (
                    <tr key={item.id}>
                      <td className="raw-text-cell">
                        <strong>{item.raw_text}</strong>
                      </td>
                      <td>
                        <select
                          value={item.matched_product_id || ''}
                          onChange={(e) =>
                            updateItem(item.id, {
                              matched_product_id: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          style={{ minWidth: 200 }}
                        >
                          <option value="">— Unmatched / Select manually —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{p.unit_price}/{p.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {item.match_confidence != null ? (
                          <span
                            className="status-chip"
                            style={{
                              background: itemConf >= 80 ? '#ecfdf5' : '#fffbeb',
                              color: itemConf >= 80 ? '#047857' : '#b45309',
                            }}
                          >
                            <span className="chip-dot" style={{ background: itemConf >= 80 ? '#10b981' : '#f59e0b' }} />
                            {itemConf}%
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          style={{ width: 90 }}
                          value={item.requested_quantity ?? ''}
                          onChange={(e) =>
                            updateItem(item.id, { requested_quantity: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{item.unit || 'kg'}</span>
                      </td>
                      <td>
                        {previewRow ? (
                          previewRow.matched ? (
                            <span
                              className="status-chip"
                              style={{
                                background: previewRow.in_stock ? '#ecfdf5' : '#fef2f2',
                                color: previewRow.in_stock ? '#047857' : '#dc2626',
                                borderColor: previewRow.in_stock ? '#a7f3d0' : '#fecaca',
                              }}
                            >
                              <span className="chip-dot" style={{ background: previewRow.in_stock ? '#10b981' : '#ef4444' }} />
                              {previewRow.available_stock} available {previewRow.in_stock ? '✓' : `(Short ${previewRow.shortfall})`}
                            </span>
                          ) : (
                            <span className="muted">No product mapped</span>
                          )
                        ) : (
                          <span className="muted" style={{ fontSize: '0.85rem' }}>
                            Click "Run Live Inventory Check"
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-link"
                          style={{ color: '#ef4444', fontSize: '0.82rem' }}
                          onClick={() => handleDeleteItem(item.id)}
                          title="Remove item"
                        >
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote Generation Section */}
      {rfq.quote ? (
        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ color: '#166534', marginBottom: 4 }}>Quote Already Generated</h2>
              <p style={{ color: '#15803d', margin: 0 }}>
                This RFQ is linked to <strong>Quote #{rfq.quote.id}</strong> (Status: {rfq.quote.status}).
              </p>
            </div>
            <Link to={`/quotes/${rfq.quote.id}`} className="btn-primary">
              View Quote #{rfq.quote.id} →
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2>Generate Quotation &amp; Trigger HITL Approval</h2>
            <span className="badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
              Step 5 &amp; 6 Workflow
            </span>
          </div>

          <p className="muted" style={{ maxWidth: 700 }}>
            Synthesizes line items, calculates totals with standard price points, attaches customer terms, and sends draft quotation to the Reviewer/Admin dashboard for human-in-the-loop approval.
          </p>

          <div style={{ marginTop: 18 }}>
            <button
              className="btn-primary"
              onClick={handleGenerateQuote}
              disabled={matchedCount === 0 || !rfq.customer}
              style={{ padding: '12px 26px', fontSize: '0.98rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Generate Quote Draft
            </button>
          </div>

          {/* Explicit Guidance Checklist */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {!rfq.customer && (
              <div style={{ color: '#dc2626', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✕</span> Link this RFQ to a customer above to enable quote generation.
              </div>
            )}
            {rfq.customer && (
              <div style={{ color: '#16a34a', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> Customer linked: {rfq.customer.name} ({rfq.customer.company})
              </div>
            )}

            {matchedCount === 0 && (
              <div style={{ color: '#dc2626', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✕</span> At least one line item needs a matched product.
              </div>
            )}
            {matchedCount > 0 && (
              <div style={{ color: '#16a34a', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> {matchedCount} product(s) matched and ready for pricing.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
