import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home-container">
      <img src="/images/logo.png" alt="Logo" className="home-logo" />
      <h1>Welcome</h1>

      <div className="button-grid">
        <Link to="/coupons">Coupons</Link>
        <Link to="/recipes">Recipes</Link>
        <Link to="/movies">Movies</Link>
      </div>
    </main>
  );
}

export default Home;
