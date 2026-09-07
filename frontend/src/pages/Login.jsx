import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const DEMO_ACCOUNTS = [
  {
    label: 'Sales Representative',
    email: 'sales@demo.com',
    desc: 'Simulate RFQs, manage leads & pipeline',
    tag: 'Sales',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    label: 'HITL Reviewer',
    email: 'reviewer@demo.com',
    desc: 'Review, price-check & approve quotes',
    tag: 'Reviewer',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    label: 'System Administrator',
    email: 'admin@demo.com',
    desc: 'Full catalog, inventory & access control',
    tag: 'Admin',
    color: '#7c3aed',
    bg: '#faf5ff',
  },
];

export default function Login() {
  const [email, setEmail] = useState('sales@demo.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-auth-container">
      {/* Left Brand & Feature Showcase Panel */}
      <div className="split-auth-brand-side">
        {/* Animated Background Glowing Mesh Orbs */}
        <div className="auth-ambient-orb orb-1" />
        <div className="auth-ambient-orb orb-2" />

        <div className="brand-side-content">
          <div className="brand-logo-container">
            <Logo size="large" showTagline={true} variant="on-dark" />
          </div>

          <h1 className="brand-hero-title">
            Intelligent Chemical &amp; Industrial <br />
            <span className="gradient-text-animated">RFQ Automation Engine</span>
          </h1>

          <p className="brand-hero-desc">
            Transform multi-channel emails, inquiries, and customer requests into verified catalog orders, live inventory reservations, and reviewer-approved quotations in seconds.
          </p>

          <div className="feature-bullets-grid">
            <div className="feature-bullet-card anim-delay-1">
              <div className="feature-bullet-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h4 className="feature-card-title">AI Intent &amp; Line Extraction</h4>
                  <span className="feature-tag-chip">Auto-Parser</span>
                </div>
                <p className="feature-card-desc">
                  Categorizes unstructured emails, detects CAS numbers, and normalizes messy quantities.
                </p>
              </div>
            </div>

            <div className="feature-bullet-card anim-delay-2">
              <div className="feature-bullet-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7.5 4.27 9 5.15" />
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h4 className="feature-card-title">Real-Time Inventory Matching</h4>
                  <span className="feature-tag-chip">Catalog Synced</span>
                </div>
                <p className="feature-card-desc">
                  Immediate warehouse stock verification, reorder thresholds, and shortfall calculations.
                </p>
              </div>
            </div>

            <div className="feature-bullet-card anim-delay-3">
              <div className="feature-bullet-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h4 className="feature-card-title">HITL Review &amp; Approval Gates</h4>
                  <span className="feature-tag-chip">Quality Guard</span>
                </div>
                <p className="feature-card-desc">
                  Human-in-the-loop checkpoint ensuring pricing accuracy before client dispatch.
                </p>
              </div>
            </div>
          </div>

          <div className="brand-trust-footer">
            <span className="live-dot" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#94a3b8' }}>
              Client X Enterprise System Online · SQLite / PostgreSQL Ready
            </span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="split-auth-form-side">
        <div className="split-auth-card">
          <div className="form-side-header">
            <h2>Welcome Back</h2>
            <p className="muted">Enter your credentials or use the 1-click role switcher</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 10, marginBottom: 18, color: '#dc2626', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div>
              <label>Work Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="sales@demo.com"
                required
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                className="btn-primary"
                type="submit"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: '1rem' }}
              >
                {loading ? 'Authenticating…' : 'Sign in to Workspace'}
              </button>
            </div>
          </form>

          {/* 1-Click Role Switcher */}
          <div className="quick-roles-section">
            <div className="quick-roles-title">
              <span>⚡ 1-Click Demo Accounts (Password: Password@123)</span>
            </div>

            <div className="quick-roles-list">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.email}
                  className="quick-role-item"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Password@123');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{acc.label}</strong>
                    <span className="status-chip" style={{ background: acc.bg, color: acc.color, fontSize: '0.72rem' }}>
                      {acc.tag}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {acc.desc} · <code style={{ color: 'var(--primary)' }}>{acc.email}</code>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
