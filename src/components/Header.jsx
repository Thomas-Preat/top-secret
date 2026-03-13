import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

function Header({ user }) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const loginRef = useRef(null);

  useEffect(() => {
    if (user) {
      setMessage(`Connecte en tant que ${user.email || "utilisateur"}.`);
    } else {
      setMessage("Non connecte. Connecte-toi pour activer le mode admin.");
    }
  }, [user]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!loginRef.current) return;
      if (!loginRef.current.contains(event.target)) {
        setIsLoginOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setMessage("Email and password are required.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMessage("Admin mode enabled.");
      setIsLoginOpen(false);
    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
    }
  }

  async function handleLogout() {
    if (!user) {
      setMessage("Aucune session admin active.");
      return;
    }

    try {
      await signOut(auth);
      setMessage("Logout reussi.");
      setEmail("");
      setPassword("");
      setIsLoginOpen(false);
    } catch (error) {
      setMessage(`Logout failed: ${error.message}`);
    }
  }

  return (
    <header className="header-banner">
      <h1 className="logo">
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
          Thomas Preat
        </Link>
      </h1>

      <button
        className="nav-toggle"
        aria-expanded={isNavOpen}
        aria-controls="primary-nav"
        aria-label="Ouvrir le menu"
        type="button"
        onClick={() => setIsNavOpen((current) => !current)}
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>

      <nav id="primary-nav" className={`nav-menu ${isNavOpen ? "show" : ""}`}>
        <NavLink to="/" onClick={() => setIsNavOpen(false)}>
          Accueil
        </NavLink>
        <NavLink to="/coupons" onClick={() => setIsNavOpen(false)}>
          Coupons
        </NavLink>
        <NavLink to="/recettes" onClick={() => setIsNavOpen(false)}>
          Recettes
        </NavLink>
        <NavLink to="/movies" onClick={() => setIsNavOpen(false)}>
          Movies
        </NavLink>

        <div className="nav-admin" ref={loginRef}>
          <button
            id="admin-menu-toggle"
            className="admin-toggle"
            type="button"
            aria-expanded={isLoginOpen}
            aria-controls="admin-login"
            onClick={() => setIsLoginOpen((current) => !current)}
          >
            {user ? "Admin (connecte)" : "Admin"}
          </button>

          <div id="admin-login" className={`admin-login ${isLoginOpen ? "active" : ""}`} hidden={!isLoginOpen}>
            <input
              type="email"
              id="admin-username"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              type="password"
              id="admin-password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button id="loginBtn" type="button" onClick={handleLogin}>
              Login
            </button>
            <button id="logoutBtn" type="button" onClick={handleLogout}>
              Logout
            </button>
            <p id="admin-login-msg" className="admin-login-msg">
              {message}
            </p>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
