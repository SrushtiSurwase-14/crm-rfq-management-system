const STATUS_CONFIG = {
  // Leads
  new: { label: 'New Lead', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', dot: '#3b82f6' },
  contacted: { label: 'Contacted', bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#22c55e' },
  qualified: { label: 'Qualified', bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff', dot: '#9333ea' },
  converted: { label: 'Converted', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', dot: '#10b981' },
  lost: { label: 'Lost', bg: '#fef2f2', text: '#dc2626', border: '#fecaca', dot: '#ef4444' },

  // RFQs
  received: { label: 'Received', bg: '#f8fafc', text: '#475569', border: '#e2e8f0', dot: '#64748b' },
  extracted: { label: 'Extracted & Matched', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
  quote_drafted: { label: 'Quote Drafted', bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', dot: '#7c3aed' },
  not_rfq: { label: 'Not RFQ', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1', dot: '#94a3b8' },

  // Quotes
  draft: { label: 'Draft', bg: '#f8fafc', text: '#475569', border: '#e2e8f0', dot: '#94a3b8' },
  pending_approval: { label: 'Needs Review', bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b', pulse: true },
  approved: { label: 'Approved & Sent', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' },
  rejected: { label: 'Rejected', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
  sent: { label: 'Sent to Client', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', dot: '#10b981' },

  // Boolean
  true: { label: 'Yes / In Stock', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' },
  false: { label: 'No / Short Stock', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
};

export default function StatusBadge({ value }) {
  if (value === undefined || value === null) return null;

  const key = String(value).toLowerCase();
  const cfg = STATUS_CONFIG[key] || {
    label: String(value).replace(/_/g, ' '),
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
    dot: '#94a3b8',
  };

  return (
    <span
      className={`status-chip ${cfg.pulse ? 'pulse-chip' : ''}`}
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        borderColor: cfg.border,
      }}
    >
      <span
        className="chip-dot"
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}
