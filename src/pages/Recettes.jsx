import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

function parseCsv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function toPrepMinutes(prepTime) {
  const numeric = Number.parseInt(String(prepTime), 10);
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function Recettes({ user }) {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState([]);
  const [activeProteins, setActiveProteins] = useState([]);
  const [sortMode, setSortMode] = useState("name-asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState(null);
  const filterPanelRef = useRef(null);

  const [selectedId, setSelectedId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPhoto, setAdminPhoto] = useState("");
  const [adminType, setAdminType] = useState("");
  const [adminProtein, setAdminProtein] = useState("");
  const [adminPrep, setAdminPrep] = useState("");
  const [adminLink, setAdminLink] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [adminPrice, setAdminPrice] = useState("");

  const isAdmin = Boolean(user);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!filterPanelRef.current) return;
      if (!filterPanelRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function loadRecipes() {
    const loadedRecipes = [];
    const snapshot = await getDocs(collection(db, "recipeList"));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      loadedRecipes.push({
        id: docSnap.id,
        name: sanitizeText(data.name) || "Unnamed Recipe",
        type: Array.isArray(data.type) ? data.type : [],
        protein: Array.isArray(data.protein) ? data.protein : [],
        photo: sanitizeText(data.photo),
        prepTime: sanitizeText(data.prepTime),
        link: sanitizeText(data.link),
        notes: sanitizeText(data.notes),
        price: sanitizeText(data.price)
      });
    });

    setRecipes(loadedRecipes);
  }

  const typeOptions = useMemo(() => {
    const values = new Set();
    recipes.forEach((recipe) => recipe.type.forEach((item) => values.add(item)));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [recipes]);

  const proteinOptions = useMemo(() => {
    const values = new Set();
    recipes.forEach((recipe) => recipe.protein.forEach((item) => values.add(item)));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [recipes]);

  const displayedRecipes = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();

    const filtered = recipes.filter((item) => {
      const matchesSearch =
        !lowerQuery ||
        item.name.toLowerCase().includes(lowerQuery) ||
        item.notes.toLowerCase().includes(lowerQuery);

      const matchesType =
        activeTypes.length === 0 || (item.type || []).some((type) => activeTypes.includes(type));

      const matchesProtein =
        activeProteins.length === 0 ||
        (item.protein || []).some((protein) => activeProteins.includes(protein));

      return matchesSearch && matchesType && matchesProtein;
    });

    return filtered.slice().sort((a, b) => {
      if (sortMode === "name-asc") {
        return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      }

      if (sortMode === "name-desc") {
        return b.name.localeCompare(a.name, "fr", { sensitivity: "base" });
      }

      if (sortMode === "prep-asc") {
        return toPrepMinutes(a.prepTime) - toPrepMinutes(b.prepTime);
      }

      if (sortMode === "prep-desc") {
        return toPrepMinutes(b.prepTime) - toPrepMinutes(a.prepTime);
      }

      return 0;
    });
  }, [activeProteins, activeTypes, recipes, searchQuery, sortMode]);

  function toggleType(type) {
    setActiveTypes((current) => {
      if (current.includes(type)) {
        return current.filter((entry) => entry !== type);
      }
      return [...current, type];
    });
  }

  function toggleProtein(protein) {
    setActiveProteins((current) => {
      if (current.includes(protein)) {
        return current.filter((entry) => entry !== protein);
      }
      return [...current, protein];
    });
  }

  function handleSelectRecipe(nextId) {
    setSelectedId(nextId);
    const recipe = recipes.find((entry) => entry.id === nextId);

    if (!recipe) {
      setAdminName("");
      setAdminPhoto("");
      setAdminType("");
      setAdminProtein("");
      setAdminPrep("");
      setAdminLink("");
      setAdminNotes("");
      setAdminPrice("");
      return;
    }

    setAdminName(recipe.name || "");
    setAdminPhoto(recipe.photo || "");
    setAdminType((recipe.type || []).join(","));
    setAdminProtein((recipe.protein || []).join(","));
    setAdminPrep(recipe.prepTime || "");
    setAdminLink(recipe.link || "");
    setAdminNotes(recipe.notes || "");
    setAdminPrice(recipe.price || "");
  }

  async function handleCreate() {
    const newRecipe = {
      name: sanitizeText(adminName),
      type: parseCsv(adminType),
      protein: parseCsv(adminProtein),
      photo: sanitizeText(adminPhoto),
      prepTime: sanitizeText(adminPrep),
      link: sanitizeText(adminLink),
      notes: sanitizeText(adminNotes),
      price: sanitizeText(adminPrice)
    };

    if (!newRecipe.name || !newRecipe.type.length) {
      alert("Name and Type are required.");
      return;
    }

    await addDoc(collection(db, "recipeList"), newRecipe);
    await loadRecipes();
  }

  async function handleUpdate() {
    if (!selectedId) return;

    await updateDoc(doc(db, "recipeList", selectedId), {
      name: sanitizeText(adminName),
      type: parseCsv(adminType),
      protein: parseCsv(adminProtein),
      photo: sanitizeText(adminPhoto),
      prepTime: sanitizeText(adminPrep),
      link: sanitizeText(adminLink),
      notes: sanitizeText(adminNotes),
      price: sanitizeText(adminPrice)
    });

    await loadRecipes();
  }

  async function handleDelete() {
    if (!selectedId) return;

    await deleteDoc(doc(db, "recipeList", selectedId));
    setSelectedId("");
    await loadRecipes();
  }

  return (
    <main>
      {isAdmin ? (
        <div id="admin-editor" style={{ display: "flex" }}>
          <select
            id="admin-select"
            value={selectedId}
            onChange={(event) => handleSelectRecipe(event.target.value)}
          >
            <option value="">-- Choix recette --</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            id="admin-name"
            placeholder="Nom (obligatoire)"
            value={adminName}
            onChange={(event) => setAdminName(event.target.value)}
          />
          <input
            type="text"
            id="admin-photo"
            placeholder="Photo URL (optionnel)"
            value={adminPhoto}
            onChange={(event) => setAdminPhoto(event.target.value)}
          />
          <input
            type="text"
            id="admin-type"
            placeholder="Type (obligatoire, separe par ,)"
            value={adminType}
            onChange={(event) => setAdminType(event.target.value)}
          />
          <input
            type="text"
            id="admin-protein"
            placeholder="Proteine (optionnel, separe par ,)"
            value={adminProtein}
            onChange={(event) => setAdminProtein(event.target.value)}
          />
          <input
            type="text"
            id="admin-prep"
            placeholder="Temps preparation (optionnel)"
            value={adminPrep}
            onChange={(event) => setAdminPrep(event.target.value)}
          />
          <input
            type="text"
            id="admin-link"
            placeholder="Lien recette (optionnel)"
            value={adminLink}
            onChange={(event) => setAdminLink(event.target.value)}
          />
          <input
            type="text"
            id="admin-notes"
            placeholder="Notes (optionnel)"
            value={adminNotes}
            onChange={(event) => setAdminNotes(event.target.value)}
          />
          <input
            type="text"
            id="admin-price"
            placeholder="Prix (optionnel)"
            value={adminPrice}
            onChange={(event) => setAdminPrice(event.target.value)}
          />
          <button id="admin-create" type="button" onClick={handleCreate}>
            Creer
          </button>
          <button id="admin-update" type="button" onClick={handleUpdate}>
            Mettre a jour
          </button>
          <button id="admin-delete" type="button" onClick={handleDelete}>
            Supprimer
          </button>
        </div>
      ) : null}

      <div className="check-controls" ref={filterPanelRef}>
        <input
          type="search"
          id="recipe-search"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value.trim())}
        />

        <button
          id="filter-toggle"
          aria-label="Filtres"
          type="button"
          aria-expanded={filterOpen}
          aria-controls="filter-panel"
          onClick={() => setFilterOpen((current) => !current)}
        >
          ☰
        </button>

        <div id="filter-panel" hidden={!filterOpen}>
          <div className="filter-section">
            <h4>Type</h4>
            <div id="type-filters">
              {typeOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`tag-btn ${activeTypes.includes(type) ? "active" : ""}`}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <h4>Proteine</h4>
            <div id="protein-filters">
              {proteinOptions.map((protein) => (
                <button
                  key={protein}
                  type="button"
                  className={`tag-btn ${activeProteins.includes(protein) ? "active" : ""}`}
                  onClick={() => toggleProtein(protein)}
                >
                  {protein}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <h4>Trier</h4>
            <button
              data-sort="name-asc"
              type="button"
              className={sortMode === "name-asc" ? "active" : ""}
              onClick={() => setSortMode("name-asc")}
            >
              Nom A vers Z
            </button>
            <button
              data-sort="name-desc"
              type="button"
              className={sortMode === "name-desc" ? "active" : ""}
              onClick={() => setSortMode("name-desc")}
            >
              Nom Z vers A
            </button>
            <button
              data-sort="prep-asc"
              type="button"
              className={sortMode === "prep-asc" ? "active" : ""}
              onClick={() => setSortMode("prep-asc")}
            >
              Preparation croissante
            </button>
            <button
              data-sort="prep-desc"
              type="button"
              className={sortMode === "prep-desc" ? "active" : ""}
              onClick={() => setSortMode("prep-desc")}
            >
              Preparation decroissante
            </button>
          </div>
        </div>
      </div>

      <section id="recipes">
        {displayedRecipes.map((item) => {
          const isOpen = openRecipeId === item.id;

          return (
            <div key={item.id} className={`recipe-card ${isOpen ? "open" : ""}`}>
              <div
                className="recipe-header"
                onClick={() => setOpenRecipeId((current) => (current === item.id ? null : item.id))}
              >
                <img src={item.photo || ""} alt={item.name} className="recipe-photo" loading="lazy" />

                <div>
                  <div className="recipe-name">{item.name}</div>
                  <div className="recipe-tags">
                    {(item.type || []).map((type) => (
                      <span key={`${item.id}-${type}`} className="tag type-tag">
                        {type}
                      </span>
                    ))}
                    {(item.protein || []).map((protein) => (
                      <span key={`${item.id}-${protein}`} className="tag protein-tag">
                        {protein}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="recipe-details">
                <div>
                  <strong>Prep Time:</strong> {item.prepTime || "-"}
                </div>
                <div>
                  <strong>Price:</strong> {item.price || "-"}
                </div>
                <div>
                  <strong>Link:</strong>{" "}
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      View Recipe
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
                <div>
                  <strong>Notes:</strong> {item.notes || "-"}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

export default Recettes;
