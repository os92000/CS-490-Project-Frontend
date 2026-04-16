import React from 'react';

/**
 * Avatar component - shows profile picture if available, falls back to initials
 * Props: src, name, size (px number, default 40), style
 */
const Avatar = ({ src, name = '', size = 40, style = {} }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, var(--green), var(--teal))',
    fontSize: Math.round(size * 0.38),
    fontWeight: 700,
    color: '#000',
    fontFamily: "'DM Sans', sans-serif",
    ...style,
  };

  if (src) {
    return (
      <div style={base}>
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; e.target.parentNode.dataset.showInitials = 'true'; e.target.parentNode.querySelector('.av-initials').style.display = 'block'; }}
        />
        <span className="av-initials" style={{ display: 'none', position: 'absolute' }}>{initials}</span>
      </div>
    );
  }

  return <div style={base}>{initials}</div>;
};

export default Avatar;
