import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const baseUrl = import.meta.env.BASE_URL || "/";
const imagePath = (fileName) => `${baseUrl}images/${fileName}`;
const PRIVATE_TAG = "private";

const IMAGE_MAP = {
  default: { src: imagePath("default.jpg"), position: "50% 50%" },
  bed: { src: imagePath("bed.jpg"), position: "50% 50%" },
  relax: { src: imagePath("relax.jpg"), position: "80% 55%" },
  trobbio: { src: imagePath("trobbio.jpg"), position: "50% 50%" },
  outside: { src: imagePath("outside.jpg"), position: "50% 30%" },
  cooking: { src: imagePath("cooking.jpg"), position: "50% 70%" }
};

function normalizeTags(value) {
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function isPrivateItem(tags = []) {
  return tags.some((tag) => String(tag).trim().toLowerCase() === PRIVATE_TAG);
}

function Coupons({ user }) {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [sortMode, setSortMode] = useState("default");
  const [filterOpen, setFilterOpen] = useState(false);
  const [openItemId, setOpenItemId] = useState(null);
  const filterPanelRef = useRef(null);

  const [selectedId, setSelectedId] = useState("");
  const [adminTitle, setAdminTitle] = useState("");
  const [adminDesc, setAdminDesc] = useState("");
  const [adminImage, setAdminImage] = useState("default");
  const [adminTags, setAdminTags] = useState("");

  const isAdmin = Boolean(user);

  useEffect(() => {
    loadChecklist();
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

  async function loadChecklist() {
    const loadedItems = [];
    const snapshot = await getDocs(collection(db, "checklist"));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      loadedItems.push({
        id: docSnap.id,
        label: data.label || "Sans titre",
        description: data.description || "",
        imageTag: data.imageTag || "default",
        tags: Array.isArray(data.tags) ? data.tags : [],
        checked: Boolean(data.checked)
      });
    });

    setItems(loadedItems);
  }

  const availableTags = useMemo(() => {
    const tags = new Set();
    items.forEach((item) => {
      (item.tags || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags)
      .filter((tag) => isAdmin || String(tag).trim().toLowerCase() !== PRIVATE_TAG)
      .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [isAdmin, items]);

  const filteredItems = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();

    const filtered = items.filter((item) => {
      if (!isAdmin && isPrivateItem(item.tags || [])) {
        return false;
      }

      const matchesSearch =
        !lowerQuery ||
        item.label.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery);

      const matchesTags =
        activeTags.length === 0 || activeTags.every((tag) => (item.tags || []).includes(tag));

      return matchesSearch && matchesTags;
    });

    const sorted = filtered
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));

    if (sortMode === "za") {
      sorted.reverse();
      return sorted;
    }

    if (sortMode === "default") {
      const notDone = sorted.filter((item) => !item.checked);
      const done = sorted.filter((item) => item.checked);
      return [...notDone, ...done];
    }

    return sorted;
  }, [activeTags, isAdmin, items, searchQuery, sortMode]);

  function toggleTag(tag) {
    setActiveTags((current) => {
      if (current.includes(tag)) {
        return current.filter((entry) => entry !== tag);
      }
      return [...current, tag];
    });
  }

  async function toggleChecked(item) {
    if (!isAdmin) return;

    const nextChecked = !item.checked;
    await updateDoc(doc(db, "checklist", item.id), { checked: nextChecked });

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, checked: nextChecked } : entry
      )
    );
  }

  function handleSelectAdminItem(nextId) {
    setSelectedId(nextId);
    const selectedItem = items.find((item) => item.id === nextId);

    if (!selectedItem) {
      setAdminTitle("");
      setAdminDesc("");
      setAdminImage("default");
      setAdminTags("");
      return;
    }

    setAdminTitle(selectedItem.label || "");
    setAdminDesc(selectedItem.description || "");
    setAdminImage(selectedItem.imageTag || "default");
    setAdminTags((selectedItem.tags || []).join(","));
  }

  async function handleCreate() {
    const label = adminTitle.trim();
    if (!label) return;

    await addDoc(collection(db, "checklist"), {
      label,
      description: adminDesc.trim(),
      imageTag: adminImage || "default",
      tags: normalizeTags(adminTags),
      checked: false
    });

    await loadChecklist();
  }

  async function handleUpdate() {
    if (!selectedId) return;

    await updateDoc(doc(db, "checklist", selectedId), {
      label: adminTitle.trim(),
      description: adminDesc.trim(),
      imageTag: adminImage || "default",
      tags: normalizeTags(adminTags)
    });

    await loadChecklist();
  }

  async function handleDelete() {
    if (!selectedId) return;

    await deleteDoc(doc(db, "checklist", selectedId));
    setSelectedId("");
    setAdminTitle("");
    setAdminDesc("");
    setAdminImage("default");
    setAdminTags("");

    await loadChecklist();
  }

  return (
    <main>
      {isAdmin ? (
        <div id="admin-editor" style={{ display: "flex" }}>
          <select
            id="admin-select"
            value={selectedId}
            onChange={(event) => handleSelectAdminItem(event.target.value)}
          >
            <option value="">-- Choix coupon --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            id="admin-title"
            placeholder="Label"
            value={adminTitle}
            onChange={(event) => setAdminTitle(event.target.value)}
          />
          <input
            type="text"
            id="admin-desc"
            placeholder="Description"
            value={adminDesc}
            onChange={(event) => setAdminDesc(event.target.value)}
          />
          <select
            id="admin-image"
            value={adminImage}
            onChange={(event) => setAdminImage(event.target.value)}
          >
            <option value="default">-- Choix image --</option>
            <option value="bed">Lit</option>
            <option value="relax">Relax</option>
            <option value="outside">Exterieur</option>
            <option value="cooking">Cuisine</option>
            <option value="trobbio">Trobbio</option>
          </select>
          <input
            type="text"
            id="admin-tags"
            placeholder="Tags (comma separated)"
            value={adminTags}
            onChange={(event) => setAdminTags(event.target.value)}
          />
          <button id="admin-create" type="button" onClick={handleCreate}>
            Creer
          </button>
          <button id="admin-update" type="button" onClick={handleUpdate}>
            Mettre a jour
          </button>
          <button id="admin-delete" type="button" onClick={handleDelete}>
            Effacer
          </button>
        </div>
      ) : null}

      <div className="check-controls" ref={filterPanelRef}>
        <input
          type="search"
          id="check-search"
          placeholder="Rechercher..."
          autoComplete="off"
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
            <h4>Trier</h4>
            <button
              data-sort="default"
              type="button"
              className={sortMode === "default" ? "active" : ""}
              onClick={() => setSortMode("default")}
            >
              Non faits vers faits (A-Z)
            </button>
            <button
              data-sort="az"
              type="button"
              className={sortMode === "az" ? "active" : ""}
              onClick={() => setSortMode("az")}
            >
              A-Z
            </button>
            <button
              data-sort="za"
              type="button"
              className={sortMode === "za" ? "active" : ""}
              onClick={() => setSortMode("za")}
            >
              Z-A
            </button>
          </div>

          <div className="filter-section">
            <h4>Tags</h4>
            <div id="tag-filters">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-btn ${activeTags.includes(tag) ? "active" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section id="checklist">
        {filteredItems.map((item) => {
          const normalizedImageTag = String(item.imageTag || "default").trim().toLowerCase();
          const imageConfig = IMAGE_MAP[normalizedImageTag] || IMAGE_MAP.default;
          const isOpen = openItemId === item.id;

          return (
            <div
              key={item.id}
              className={`check-item ${item.checked ? "checked" : ""} ${isOpen ? "open" : ""}`}
              style={{
                backgroundImage: `url(${imageConfig.src})`,
                backgroundPosition: imageConfig.position || "center"
              }}
              onClick={(event) => {
                if (event.target instanceof HTMLInputElement) return;
                setOpenItemId((current) => (current === item.id ? null : item.id));
              }}
            >
              <input
                type="checkbox"
                checked={item.checked}
                disabled={!isAdmin}
                onChange={() => toggleChecked(item)}
              />
              <div className="check-text">
                <div className="check-label">{item.label}</div>
                <div className="check-description">{item.description}</div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

export default Coupons;
