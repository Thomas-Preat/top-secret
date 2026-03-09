function RecipeCard({ item, isOpen, isAdmin, onToggleOpen, onEdit, children }) {
  return (
    <div className={`recipe-card ${isOpen ? "open" : ""}`}>
      <div className="recipe-header" onClick={onToggleOpen}>
        <img src={item.photo || ""} alt={item.name} className="recipe-photo" loading="lazy" />

        <div className="recipe-meta">
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

        {children}
      </div>
    </div>
  );
}

export default RecipeCard;
