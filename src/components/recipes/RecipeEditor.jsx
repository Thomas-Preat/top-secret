function RecipeEditor({ mode, values, onChange, onCreate, onUpdate, onDelete, onCancel, className = "" }) {
  return (
    <div
      className={`inline-editor ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Name (required)"
        value={values.name}
        onChange={(event) => onChange("name", event.target.value)}
      />
      <input
        type="text"
        placeholder="Photo URL (optional)"
        value={values.photo}
        onChange={(event) => onChange("photo", event.target.value)}
      />
      <input
        type="text"
        placeholder="Type (required, comma-separated)"
        value={values.type}
        onChange={(event) => onChange("type", event.target.value)}
      />
      <input
        type="text"
        placeholder="Protein (optional, comma-separated)"
        value={values.protein}
        onChange={(event) => onChange("protein", event.target.value)}
      />
      <input
        type="text"
        placeholder="Prep time (optional)"
        value={values.prep}
        onChange={(event) => onChange("prep", event.target.value)}
      />
      <input
        type="text"
        placeholder="Recipe link (optional)"
        value={values.link}
        onChange={(event) => onChange("link", event.target.value)}
      />
      <input
        type="text"
        placeholder="Notes (optional)"
        value={values.notes}
        onChange={(event) => onChange("notes", event.target.value)}
      />
      <input
        type="text"
        placeholder="Price (optional)"
        value={values.price}
        onChange={(event) => onChange("price", event.target.value)}
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

export default RecipeEditor;
