import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.get('/quotes').then(({ data }) => setQuotes(data.quotes));
  }, []);

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      (q.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customer?.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(q.id).includes(searchQuery);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && q.status === statusFilter;
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Commercial Quotations</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            System-generated draft quotations awaiting Human-in-the-Loop (HITL) approval prior to dispatch.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>Quote Pipeline</h2>
            <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>
              {filteredQuotes.length} quotations
            </span>
          </div>
        </div>

        <div className="search-filter-bar">
          <div className="search-input-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by quote ID, customer, or company…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', 'pending_approval', 'approved', 'rejected', 'draft'].map((st) => (
              <button
                key={st}
                type="button"
                className={statusFilter === st ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Quote Reference</th>
                <th>Source RFQ</th>
                <th>Customer Account</th>
                <th>Total Value (₹)</th>
                <th>Review Status</th>
                <th>Approved / Reviewed By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link to={`/quotes/${q.id}`} className="table-tag-id">
                      #QUO-{q.id}
                    </Link>
                  </td>
                  <td>
                    {q.rfq ? (
                      <Link to={`/rfqs/${q.rfq.id}`} style={{ fontWeight: 600 }}>
                        #RFQ-{q.rfq.id}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <strong>{q.customer?.name}</strong>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{q.customer?.company}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      ₹{q.total_amount?.toLocaleString() || q.total_amount}
                    </strong>
                  </td>
                  <td>
                    <StatusBadge value={q.status} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{q.reviewer?.name || 'Pending Review'}</span>
                  </td>
                  <td>
                    <Link to={`/quotes/${q.id}`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                      Review Quote →
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No quotes found matching your filters.
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
