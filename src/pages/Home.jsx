import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home-container">
      <img src="/images/logo.png" alt="Logo" className="home-logo" />
      <h1>Bienvenue</h1>

      <div className="button-grid">
        <Link to="/coupons">Coupons</Link>
        <Link to="/recettes">Recettes</Link>
      </div>
    </main>
  );
}

export default Home;
