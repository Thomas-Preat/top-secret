function MovieEditor({ mode, values, onChange, onCreate, onUpdate, onDelete, onCancel, className = "" }) {
  return (
    <div
      className={`inline-editor movie-inline-editor ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Title (required)"
        value={values.title}
        onChange={(event) => onChange("title", event.target.value)}
      />
      <input
        type="text"
        placeholder="Poster URL (optional)"
        value={values.poster}
        onChange={(event) => onChange("poster", event.target.value)}
      />
      <input
        type="text"
        placeholder="Genres (comma-separated)"
        value={values.genres}
        onChange={(event) => onChange("genres", event.target.value)}
      />
      <input
        type="text"
        placeholder="Year (optional)"
        value={values.year}
        onChange={(event) => onChange("year", event.target.value)}
      />
      <select
        value={values.watched}
        onChange={(event) => onChange("watched", event.target.value)}
      >
        <option value="false">Wishlist</option>
        <option value="true">Watched</option>
      </select>
      <input
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="My score (0-10)"
        value={values.myScore}
        onChange={(event) => onChange("myScore", event.target.value)}
      />
      <input
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="Partner score (0-10)"
        value={values.partnerScore}
        onChange={(event) => onChange("partnerScore", event.target.value)}
      />
      <input
        type="text"
        placeholder="Link (optional)"
        value={values.link}
        onChange={(event) => onChange("link", event.target.value)}
      />
      <input
        type="text"
        placeholder="Notes (optional)"
        value={values.notes}
        onChange={(event) => onChange("notes", event.target.value)}
      />

      <div className="inline-editor-actions">
        {mode === "create" ? (
          <>
            <button type="button" onClick={onCreate}>
              Create
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onUpdate}>
              Save
            </button>
            <button type="button" onClick={onDelete}>
              Delete
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MovieEditor;