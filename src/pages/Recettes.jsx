import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import RecipeCard from "../components/recipes/RecipeCard";
import RecipeEditor from "../components/recipes/RecipeEditor";

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
  const [isCreating, setIsCreating] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminPhoto, setAdminPhoto] = useState("");
  const [adminType, setAdminType] = useState("");
  const [adminProtein, setAdminProtein] = useState("");
  const [adminPrep, setAdminPrep] = useState("");
  const [adminLink, setAdminLink] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [adminPrice, setAdminPrice] = useState("");

  const isAdmin = Boolean(user);

  const editorValues = {
    name: adminName,
    photo: adminPhoto,
    type: adminType,
    protein: adminProtein,
    prep: adminPrep,
    link: adminLink,
    notes: adminNotes,
    price: adminPrice
  };

  function updateEditorValue(field, value) {
    if (field === "name") setAdminName(value);
    if (field === "photo") setAdminPhoto(value);
    if (field === "type") setAdminType(value);
    if (field === "protein") setAdminProtein(value);
    if (field === "prep") setAdminPrep(value);
    if (field === "link") setAdminLink(value);
    if (field === "notes") setAdminNotes(value);
    if (field === "price") setAdminPrice(value);
  }

  function resetEditor() {
    setAdminName("");
    setAdminPhoto("");
    setAdminType("");
    setAdminProtein("");
    setAdminPrep("");
    setAdminLink("");
    setAdminNotes("");
    setAdminPrice("");
  }

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
      resetEditor();
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

  function startEditRecipe(recipeId) {
    setIsCreating(false);
    handleSelectRecipe(recipeId);
    setOpenRecipeId(recipeId);
  }

  function startCreateRecipe() {
    setIsCreating(true);
    setSelectedId("");
    resetEditor();
    setOpenRecipeId(null);
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
    setIsCreating(false);
    resetEditor();
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
    setOpenRecipeId(null);
    await loadRecipes();
  }

  return (
    <main>
      <div className="check-controls" ref={filterPanelRef}>
        <input
          type="search"
          id="recipe-search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value.trim())}
        />

        {isAdmin ? (
          <button type="button" className="add-card-btn" onClick={startCreateRecipe}>
            Add Card
          </button>
        ) : null}

        <button
          id="filter-toggle"
          aria-label="Filters"
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
            <h4>Protein</h4>
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
            <h4>Sort</h4>
            <button
              data-sort="name-asc"
              type="button"
              className={sortMode === "name-asc" ? "active" : ""}
              onClick={() => setSortMode("name-asc")}
            >
              Name A-Z
            </button>
            <button
              data-sort="name-desc"
              type="button"
              className={sortMode === "name-desc" ? "active" : ""}
              onClick={() => setSortMode("name-desc")}
            >
              Name Z-A
            </button>
            <button
              data-sort="prep-asc"
              type="button"
              className={sortMode === "prep-asc" ? "active" : ""}
              onClick={() => setSortMode("prep-asc")}
            >
              Prep time ascending
            </button>
            <button
              data-sort="prep-desc"
              type="button"
              className={sortMode === "prep-desc" ? "active" : ""}
              onClick={() => setSortMode("prep-desc")}
            >
              Prep time descending
            </button>
          </div>
        </div>
      </div>

      {isAdmin && isCreating ? (
        <RecipeEditor
          mode="create"
          className="new-card-editor"
          values={editorValues}
          onChange={updateEditorValue}
          onCreate={handleCreate}
          onCancel={() => {
            setIsCreating(false);
            resetEditor();
          }}
        />
      ) : null}

      <section id="recipes">
        {displayedRecipes.map((item) => {
          const isOpen = openRecipeId === item.id;

          return (
            <RecipeCard
              key={item.id}
              item={item}
              isOpen={isOpen}
              isAdmin={isAdmin}
              onToggleOpen={() => setOpenRecipeId((current) => (current === item.id ? null : item.id))}
              onEdit={startEditRecipe}
            >
              {isAdmin && selectedId === item.id && !isCreating ? (
                <RecipeEditor
                  mode="edit"
                  className="card-inline-editor"
                  values={editorValues}
                  onChange={updateEditorValue}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onCancel={() => {
                    setSelectedId("");
                    resetEditor();
                  }}
                />
              ) : null}
            </RecipeCard>
          );
        })}
      </section>
    </main>
  );
}

export default Recettes;
