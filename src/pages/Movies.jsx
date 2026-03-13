import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import MovieCard from "../components/movies/MovieCard";
import MovieEditor from "../components/movies/MovieEditor";

function parseCsv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function sanitizeScore(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;

  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return null;

  return Math.max(0, Math.min(10, numeric));
}

function computeTotalScore(myScore, partnerScore) {
  if (!Number.isFinite(myScore) || !Number.isFinite(partnerScore)) {
    return null;
  }

  return myScore + partnerScore;
}

function toYear(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function Movies({ user }) {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [sortMode, setSortMode] = useState("title-asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [openMovieId, setOpenMovieId] = useState(null);
  const filterPanelRef = useRef(null);

  const [selectedId, setSelectedId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [adminTitle, setAdminTitle] = useState("");
  const [adminPoster, setAdminPoster] = useState("");
  const [adminGenres, setAdminGenres] = useState("");
  const [adminYear, setAdminYear] = useState("");
  const [adminWatched, setAdminWatched] = useState("false");
  const [adminMyScore, setAdminMyScore] = useState("");
  const [adminPartnerScore, setAdminPartnerScore] = useState("");
  const [adminLink, setAdminLink] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const isAdmin = Boolean(user);

  const editorValues = {
    title: adminTitle,
    poster: adminPoster,
    genres: adminGenres,
    year: adminYear,
    watched: adminWatched,
    myScore: adminMyScore,
    partnerScore: adminPartnerScore,
    link: adminLink,
    notes: adminNotes
  };

  function updateEditorValue(field, value) {
    if (field === "title") setAdminTitle(value);
    if (field === "poster") setAdminPoster(value);
    if (field === "genres") setAdminGenres(value);
    if (field === "year") setAdminYear(value);
    if (field === "watched") setAdminWatched(value);
    if (field === "myScore") setAdminMyScore(value);
    if (field === "partnerScore") setAdminPartnerScore(value);
    if (field === "link") setAdminLink(value);
    if (field === "notes") setAdminNotes(value);
  }

  function resetEditor() {
    setAdminTitle("");
    setAdminPoster("");
    setAdminGenres("");
    setAdminYear("");
    setAdminWatched("false");
    setAdminMyScore("");
    setAdminPartnerScore("");
    setAdminLink("");
    setAdminNotes("");
  }

  useEffect(() => {
    loadMovies();
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

  async function loadMovies() {
    const loadedMovies = [];
    const snapshot = await getDocs(collection(db, "movieList"));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const myScore = Number.isFinite(data.myScore) ? data.myScore : null;
      const partnerScore = Number.isFinite(data.partnerScore) ? data.partnerScore : null;

      loadedMovies.push({
        id: docSnap.id,
        title: sanitizeText(data.title) || "Untitled Movie",
        poster: sanitizeText(data.poster),
        genres: Array.isArray(data.genres) ? data.genres : [],
        year: sanitizeText(data.year),
        watched: Boolean(data.watched),
        myScore,
        partnerScore,
        totalScore: computeTotalScore(myScore, partnerScore),
        link: sanitizeText(data.link),
        notes: sanitizeText(data.notes)
      });
    });

    setMovies(loadedMovies);
  }

  const displayedMovies = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();

    const filtered = movies.filter((item) => {
      const matchesSearch =
        !lowerQuery ||
        item.title.toLowerCase().includes(lowerQuery) ||
        item.notes.toLowerCase().includes(lowerQuery) ||
        (item.genres || []).some((genre) => genre.toLowerCase().includes(lowerQuery));

      const matchesStatus =
        activeStatus === "all" || (activeStatus === "watched" ? item.watched : !item.watched);

      return matchesSearch && matchesStatus;
    });

    return filtered.slice().sort((a, b) => {
      if (sortMode === "title-asc") {
        return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
      }

      if (sortMode === "title-desc") {
        return b.title.localeCompare(a.title, "fr", { sensitivity: "base" });
      }

      if (sortMode === "score-desc") {
        return (b.totalScore ?? Number.NEGATIVE_INFINITY) - (a.totalScore ?? Number.NEGATIVE_INFINITY);
      }

      if (sortMode === "score-asc") {
        return (a.totalScore ?? Number.POSITIVE_INFINITY) - (b.totalScore ?? Number.POSITIVE_INFINITY);
      }

      if (sortMode === "year-desc") {
        return toYear(b.year) - toYear(a.year);
      }

      if (sortMode === "year-asc") {
        return toYear(a.year) - toYear(b.year);
      }

      return 0;
    });
  }, [activeStatus, movies, searchQuery, sortMode]);

  function handleSelectMovie(nextId) {
    setSelectedId(nextId);
    const movie = movies.find((entry) => entry.id === nextId);

    if (!movie) {
      resetEditor();
      return;
    }

    setAdminTitle(movie.title || "");
    setAdminPoster(movie.poster || "");
    setAdminGenres((movie.genres || []).join(","));
    setAdminYear(movie.year || "");
    setAdminWatched(movie.watched ? "true" : "false");
    setAdminMyScore(Number.isFinite(movie.myScore) ? String(movie.myScore) : "");
    setAdminPartnerScore(Number.isFinite(movie.partnerScore) ? String(movie.partnerScore) : "");
    setAdminLink(movie.link || "");
    setAdminNotes(movie.notes || "");
  }

  function startEditMovie(movieId) {
    setIsCreating(false);
    handleSelectMovie(movieId);
    setOpenMovieId(movieId);
  }

  function startCreateMovie() {
    setIsCreating(true);
    setSelectedId("");
    resetEditor();
    setOpenMovieId(null);
  }

  function getPayloadFromEditor() {
    const watched = adminWatched === "true";
    return {
      title: sanitizeText(adminTitle),
      poster: sanitizeText(adminPoster),
      genres: parseCsv(adminGenres),
      year: sanitizeText(adminYear),
      watched,
      myScore: watched ? sanitizeScore(adminMyScore) : null,
      partnerScore: watched ? sanitizeScore(adminPartnerScore) : null,
      link: sanitizeText(adminLink),
      notes: sanitizeText(adminNotes)
    };
  }

  async function handleCreate() {
    const payload = getPayloadFromEditor();

    if (!payload.title) {
      alert("Title is required.");
      return;
    }

    await addDoc(collection(db, "movieList"), payload);
    await loadMovies();
    setIsCreating(false);
    resetEditor();
  }

  async function handleUpdate() {
    if (!selectedId) return;

    await updateDoc(doc(db, "movieList", selectedId), getPayloadFromEditor());
    await loadMovies();
  }

  async function handleDelete() {
    if (!selectedId) return;

    await deleteDoc(doc(db, "movieList", selectedId));
    setSelectedId("");
    setOpenMovieId(null);
    await loadMovies();
  }

  return (
    <main>
      <div className="check-controls movies-controls" ref={filterPanelRef}>
        <input
          type="search"
          id="movie-search"
          placeholder="Search movies..."
          autoComplete="off"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value.trim())}
        />

        {isAdmin ? (
          <button type="button" className="add-card-btn" onClick={startCreateMovie}>
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
            <h4>Status</h4>
            <button
              type="button"
              className={activeStatus === "all" ? "active" : ""}
              onClick={() => setActiveStatus("all")}
            >
              All
            </button>
            <button
              type="button"
              className={activeStatus === "wishlist" ? "active" : ""}
              onClick={() => setActiveStatus("wishlist")}
            >
              Wishlist
            </button>
            <button
              type="button"
              className={activeStatus === "watched" ? "active" : ""}
              onClick={() => setActiveStatus("watched")}
            >
              Watched
            </button>
          </div>

          <div className="filter-section">
            <h4>Sort</h4>
            <button
              type="button"
              className={sortMode === "title-asc" ? "active" : ""}
              onClick={() => setSortMode("title-asc")}
            >
              Title A-Z
            </button>
            <button
              type="button"
              className={sortMode === "title-desc" ? "active" : ""}
              onClick={() => setSortMode("title-desc")}
            >
              Title Z-A
            </button>
            <button
              type="button"
              className={sortMode === "score-desc" ? "active" : ""}
              onClick={() => setSortMode("score-desc")}
            >
              Highest score
            </button>
            <button
              type="button"
              className={sortMode === "score-asc" ? "active" : ""}
              onClick={() => setSortMode("score-asc")}
            >
              Lowest score
            </button>
            <button
              type="button"
              className={sortMode === "year-desc" ? "active" : ""}
              onClick={() => setSortMode("year-desc")}
            >
              Newest year
            </button>
            <button
              type="button"
              className={sortMode === "year-asc" ? "active" : ""}
              onClick={() => setSortMode("year-asc")}
            >
              Oldest year
            </button>
          </div>
        </div>
      </div>

      {isAdmin && isCreating ? (
        <MovieEditor
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

      <section id="movies-list">
        {displayedMovies.map((item) => {
          const isOpen = openMovieId === item.id;

          return (
            <MovieCard
              key={item.id}
              item={item}
              isOpen={isOpen}
              isAdmin={isAdmin}
              onToggleOpen={() => setOpenMovieId((current) => (current === item.id ? null : item.id))}
              onEdit={startEditMovie}
            >
              {isAdmin && selectedId === item.id && !isCreating ? (
                <MovieEditor
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
            </MovieCard>
          );
        })}
      </section>
    </main>
  );
}

export default Movies;