export default function Logo({ size = 'medium', showTagline = true, variant = 'default' }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const iconDim = isLarge ? 44 : isSmall ? 28 : 34;
  const isOnDark = variant === 'on-dark';

  return (
    <div className={`brand-logo-wrap ${size} ${isOnDark ? 'on-dark' : ''}`}>
      <div className="brand-icon-box" style={{ width: iconDim, height: iconDim }}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="apexGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="apexGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* Background Rounded Shield */}
          <rect width="40" height="40" rx="10" fill="url(#apexGrad1)" />

          {/* Geometric RFQ Flow Path */}
          <path
            d="M12 28L20 12L28 28"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 22H25"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Modern Flow Orbit Dots */}
          <circle cx="20" cy="12" r="2.8" fill="#FACC15" />
          <circle cx="12" cy="28" r="2.4" fill="white" />
          <circle cx="28" cy="28" r="2.4" fill="#38BDF8" />

          {/* Inner Accent Ring */}
          <circle cx="20" cy="22" r="1.5" fill="white" />
        </svg>
      </div>

      <div className="brand-text-col">
        <div className="brand-name">
          <span className={`brand-primary ${isOnDark ? 'text-white' : ''}`}>Apex</span>
          <span className="brand-accent">RFQ</span>
          <span className={`brand-pill ${isOnDark ? 'pill-dark-bg' : ''}`}>CRM</span>
        </div>
        {showTagline && (
          <span className={`brand-tagline ${isOnDark ? 'tagline-on-dark' : ''}`}>
            Intelligent Sales &amp; Intake Engine
          </span>
        )}
      </div>
    </div>
  );
}
