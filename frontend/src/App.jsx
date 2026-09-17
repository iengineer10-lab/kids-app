import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import KidCardsPage from './pages/KidCardsPage.jsx';
import KidProgressPage from './pages/KidProgressPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { isLoggedIn, setToken } from './api.js';

function TopBar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand">
        🗺️ Quest Board
      </Link>
      <nav className="topbar__nav">
        {loggedIn ? (
          <button
            className="link-button"
            onClick={() => {
              setToken(null);
              navigate('/');
            }}
          >
            Log out
          </button>
        ) : (
          <Link to="/admin/login" className="link-button">
            Parent / Admin
          </Link>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<KidCardsPage />} />
          <Route path="/kid/:id" element={<KidProgressPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}
