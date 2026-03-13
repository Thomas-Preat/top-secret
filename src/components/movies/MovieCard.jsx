function formatScore(score) {
  return Number.isFinite(score) ? score.toFixed(1) : "-";
}

function MovieCard({ item, isOpen, isAdmin, onToggleOpen, onEdit, children }) {
  return (
    <article className={`movie-card ${isOpen ? "open" : ""}`}>
      <div className="movie-card-header" onClick={onToggleOpen}>
        <img src={item.poster || ""} alt={item.title} className="movie-poster" loading="lazy" />

        <div className="movie-main-meta">
          <div className="movie-title-row">
            <h3 className="movie-title">{item.title}</h3>
            <span className={`movie-state ${item.watched ? "watched" : "wishlist"}`}>
              {item.watched ? "Vu" : "A voir"}
            </span>
          </div>

          <div className="movie-subline">
            <span>{item.year || "Annee inconnue"}</span>
            <span className="movie-total-chip">Total: {formatScore(item.totalScore)}</span>
          </div>

          <div className="movie-tags">
            {(item.genres || []).map((genre) => (
              <span key={`${item.id}-${genre}`} className="movie-tag">
                {genre}
              </span>
            ))}
          </div>
        </div>

        {isAdmin ? (
          <button
            type="button"
            className="card-edit-btn"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(item.id);
            }}
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="movie-details">
        <div>
          <strong>Score Thomas:</strong> {formatScore(item.myScore)}
        </div>
        <div>
          <strong>Score Leeloo:</strong> {formatScore(item.partnerScore)}
        </div>
        <div>
          <strong>Total:</strong> {formatScore(item.totalScore)}
        </div>
        <div>
          <strong>Lien:</strong>{" "}
          {item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              Voir la fiche
            </a>
          ) : (
            "-"
          )}
        </div>
        <div>
          <strong>Notes:</strong> {item.notes || "-"}
        </div>

        {children}
      </div>
    </article>
  );
}

export default MovieCard;