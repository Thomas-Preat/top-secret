function MovieEditor({ mode, values, onChange, onCreate, onUpdate, onDelete, onCancel, className = "" }) {
  return (
    <div
      className={`inline-editor movie-inline-editor ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Titre (obligatoire)"
        value={values.title}
        onChange={(event) => onChange("title", event.target.value)}
      />
      <input
        type="text"
        placeholder="Poster URL (optionnel)"
        value={values.poster}
        onChange={(event) => onChange("poster", event.target.value)}
      />
      <input
        type="text"
        placeholder="Genres (separes par ,)"
        value={values.genres}
        onChange={(event) => onChange("genres", event.target.value)}
      />
      <input
        type="text"
        placeholder="Annee (optionnel)"
        value={values.year}
        onChange={(event) => onChange("year", event.target.value)}
      />
      <select
        value={values.watched}
        onChange={(event) => onChange("watched", event.target.value)}
      >
        <option value="false">A voir</option>
        <option value="true">Vu</option>
      </select>
      <input
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="Mon score (0-10)"
        value={values.myScore}
        onChange={(event) => onChange("myScore", event.target.value)}
      />
      <input
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="Score copine (0-10)"
        value={values.partnerScore}
        onChange={(event) => onChange("partnerScore", event.target.value)}
      />
      <input
        type="text"
        placeholder="Lien (optionnel)"
        value={values.link}
        onChange={(event) => onChange("link", event.target.value)}
      />
      <input
        type="text"
        placeholder="Notes (optionnel)"
        value={values.notes}
        onChange={(event) => onChange("notes", event.target.value)}
      />

      <div className="inline-editor-actions">
        {mode === "create" ? (
          <>
            <button type="button" onClick={onCreate}>
              Creer
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