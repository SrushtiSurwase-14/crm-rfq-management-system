import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function QuoteDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quote, setQuote] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data } = await api.get(`/quotes/${id}`);
    setQuote(data.quote);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const canReview = user.role === 'admin' || user.role === 'reviewer';
  const isEditable = quote && (quote.status === 'draft' || quote.status === 'pending_approval');

  const updateItem = async (itemId, patch) => {
    setError('');
    try {
      await api.put(`/quotes/${id}/items/${itemId}`, patch);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update line item');
    }
  };

  const approve = async () => {
    setError(''); setMessage('');
    try {
      const { data } = await api.post(`/quotes/${id}/approve`, { review_notes: notes });
      setMessage(data.message || 'Quote approved and recorded as sent to client!');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve quote');
    }
  };

  const reject = async () => {
    setError(''); setMessage('');
    try {
      const { data } = await api.post(`/quotes/${id}/reject`, { review_notes: notes || 'Rejected by reviewer' });
      setMessage(data.message || 'Quote rejected.');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject quote');
    }
  };

  if (!quote) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p className="muted">Loading quotation details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/quotes" className="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Quotes Pipeline
      </Link>

      <div className="page-header">
        <div>
          <h1>Quotation #QUO-{quote.id}</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Commercial quotation sheet generated from RFQ line items and current price book.
          </p>
        </div>
        <StatusBadge value={quote.status} />
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', padding: '14px 18px', marginTop: 12 }}>
          <p className="error" style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      {message && (
        <div className="card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', padding: '14px 18px', marginTop: 12 }}>
          <p className="success" style={{ margin: 0 }}>{message}</p>
        </div>
      )}

      {/* Details Box */}
      <div className="card">
        <div className="card-header">
          <h2>Quotation Summary</h2>
          <span className="badge" style={{ background: '#f8fafc', color: 'var(--text-muted)' }}>
            Created: {new Date(quote.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-item-box">
            <div className="detail-item-label">Customer Account</div>
            <div className="detail-item-value">
              <strong>{quote.customer?.name}</strong>
              <div className="muted" style={{ fontSize: '0.85rem' }}>{quote.customer?.company}</div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>{quote.customer?.email}</div>
            </div>
          </div>

          <div className="detail-item-box">
            <div className="detail-item-label">Linked Inbound RFQ</div>
            <div className="detail-item-value">
              {quote.rfq ? (
                <Link to={`/rfqs/${quote.rfq.id}`} className="table-tag-id">
                  #RFQ-{quote.rfq.id}
                </Link>
              ) : (
                'Manual Quote'
              )}
            </div>
          </div>

          <div className="detail-item-box">
            <div className="detail-item-label">Total Commercial Value</div>
            <div className="detail-item-value" style={{ fontSize: '1.6rem', color: 'var(--primary)', fontWeight: 800 }}>
              ₹{quote.total_amount?.toLocaleString() || quote.total_amount}
            </div>
          </div>

          <div className="detail-item-box">
            <div className="detail-item-label">Review Status</div>
            <div className="detail-item-value">
              <span style={{ fontWeight: 600 }}>{quote.reviewer?.name || 'Awaiting Reviewer'}</span>
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                {quote.status === 'pending_approval' ? 'Requires Approval' : `Marked as ${quote.status}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="card">
        <div className="card-header">
          <h2>Quoted Line Items ({(quote.items || []).length})</h2>
          {isEditable && (
            <span className="badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
              Editable fields (blur to save)
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Chemical / Product</th>
                <th>Quantity</th>
                <th>Unit Price (₹)</th>
                <th>Line Total (₹)</th>
                <th>Warehouse Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {(quote.items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.product?.name}</strong>
                    <div className="muted" style={{ fontSize: '0.78rem' }}>
                      {item.product?.cas_number ? `CAS: ${item.product.cas_number}` : ''}
                    </div>
                  </td>
                  <td>
                    {isEditable ? (
                      <input
                        type="number"
                        min="1"
                        style={{ width: 90 }}
                        defaultValue={item.quantity}
                        onBlur={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{item.quantity} {item.product?.unit || 'kg'}</span>
                    )}
                  </td>
                  <td>
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        style={{ width: 100 }}
                        defaultValue={item.unit_price}
                        onBlur={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })}
                      />
                    ) : (
                      <span>₹{item.unit_price}</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>
                      ₹{item.line_total?.toLocaleString() || item.line_total}
                    </strong>
                  </td>
                  <td>
                    <span
                      className="status-chip"
                      style={{
                        background: item.in_stock ? '#ecfdf5' : '#fef2f2',
                        color: item.in_stock ? '#047857' : '#dc2626',
                        borderColor: item.in_stock ? '#a7f3d0' : '#fecaca',
                      }}
                    >
                      <span className="chip-dot" style={{ background: item.in_stock ? '#10b981' : '#ef4444' }} />
                      {item.in_stock
                        ? `In Stock (${item.available_stock_at_quote} avail)`
                        : `Stock Shortfall (${item.available_stock_at_quote} avail)`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviewer Action Checkpoint */}
      {canReview && isEditable && (
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <h2>Human-in-the-Loop (HITL) Review Decision</h2>
            <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>
              Action Required
            </span>
          </div>
          <p className="muted">
            As a designated Reviewer/Admin, verify chemical quantities, pricing margins, and stock availability before dispatching this quotation to the client.
          </p>

          <label>Review Notes / Audit Trail</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add internal notes, discount justifications, or special delivery terms…"
          />

          <div className="button-row" style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={approve}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Approve &amp; Send to Customer
            </button>
            <button className="btn-danger" onClick={reject}>
              Reject Quotation
            </button>
          </div>
        </div>
      )}

      {!canReview && isEditable && (
        <div className="card" style={{ background: '#f8fafc' }}>
          <p className="muted" style={{ margin: 0 }}>
            🔒 This quote is in <strong>pending_approval</strong> status. Only users with the <strong>Reviewer</strong> or <strong>Admin</strong> role can approve or reject quotations.
          </p>
        </div>
      )}

      {quote.review_notes && (
        <div className="card">
          <h2>Official Review Record</h2>
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 8 }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-main)' }}>
              "{quote.review_notes}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
