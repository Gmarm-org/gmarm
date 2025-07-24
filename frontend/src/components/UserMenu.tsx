import React from 'react';

interface UserMenuProps {
  onUpdate: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onUpdate, onLogout }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="user-menu" ref={menuRef}>
      <button onClick={() => setShowMenu(!showMenu)} className="user-icon" aria-label="Menú de usuario">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
        </svg>
      </button>
      <div className={`user-dropdown ${showMenu ? 'show' : ''}`}> 
        <a href="#" className="user-dropdown-item" onClick={e => { e.preventDefault(); setShowMenu(false); onUpdate(); }}>
          Actualizar datos
        </a>
        <a href="#" className="user-dropdown-item logout" onClick={e => { e.preventDefault(); setShowMenu(false); onLogout(); }}>
          Cerrar sesión
        </a>
      </div>
    </div>
  );
};

export default UserMenu; 