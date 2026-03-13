import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import Header from "./components/Header";
import Home from "./pages/Home";
import Coupons from "./pages/Coupons";
import Recettes from "./pages/Recettes";
import Movies from "./pages/Movies";

function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("admin-mode", Boolean(user));
  }, [user]);

  const showHeader = location.pathname !== "/";

  return (
    <>
      {showHeader ? <Header user={user} /> : null}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/coupons" element={<Coupons user={user} />} />
        <Route path="/recipes" element={<Recettes user={user} />} />
        <Route path="/recettes" element={<Recettes user={user} />} />
        <Route path="/movies" element={<Movies user={user} />} />
      </Routes>
    </>
  );
}

export default App;
