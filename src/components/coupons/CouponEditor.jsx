const IMAGE_OPTIONS = [
  { value: "default", label: "-- Choose image --" },
  { value: "bed", label: "Bed" },
  { value: "relax", label: "Relax" },
  { value: "outside", label: "Outside" },
  { value: "cooking", label: "Cooking" },
  { value: "trobbio", label: "Trobbio" }
];

function CouponEditor({ mode, values, onChange, onCreate, onUpdate, onDelete, onCancel, className = "" }) {
  return (
    <div
      className={`inline-editor ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Label"
        value={values.title}
        onChange={(event) => onChange("title", event.target.value)}
      />
      <input
        type="text"
        placeholder="Description"
        value={values.desc}
        onChange={(event) => onChange("desc", event.target.value)}
      />
      <select
        value={values.image}
        onChange={(event) => onChange("image", event.target.value)}
      >
        {IMAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={values.tags}
        onChange={(event) => onChange("tags", event.target.value)}
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

export default CouponEditor;
