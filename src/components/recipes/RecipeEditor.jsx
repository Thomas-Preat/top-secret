function RecipeEditor({ mode, values, onChange, onCreate, onUpdate, onDelete, onCancel, className = "" }) {
  return (
    <div
      className={`inline-editor ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Nom (obligatoire)"
        value={values.name}
        onChange={(event) => onChange("name", event.target.value)}
      />
      <input
        type="text"
        placeholder="Photo URL (optionnel)"
        value={values.photo}
        onChange={(event) => onChange("photo", event.target.value)}
      />
      <input
        type="text"
        placeholder="Type (obligatoire, separe par ,)"
        value={values.type}
        onChange={(event) => onChange("type", event.target.value)}
      />
      <input
        type="text"
        placeholder="Proteine (optionnel, separe par ,)"
        value={values.protein}
        onChange={(event) => onChange("protein", event.target.value)}
      />
      <input
        type="text"
        placeholder="Temps preparation (optionnel)"
        value={values.prep}
        onChange={(event) => onChange("prep", event.target.value)}
      />
      <input
        type="text"
        placeholder="Lien recette (optionnel)"
        value={values.link}
        onChange={(event) => onChange("link", event.target.value)}
      />
      <input
        type="text"
        placeholder="Notes (optionnel)"
        value={values.notes}
        onChange={(event) => onChange("notes", event.target.value)}
      />
      <input
        type="text"
        placeholder="Prix (optionnel)"
        value={values.price}
        onChange={(event) => onChange("price", event.target.value)}
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

export default RecipeEditor;
