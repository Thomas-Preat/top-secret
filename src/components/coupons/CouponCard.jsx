function CouponCard({
  item,
  isOpen,
  isAdmin,
  imageConfig,
  onToggleOpen,
  onToggleChecked,
  onEdit,
  children
}) {
  return (
    <div
      className={`check-item ${item.checked ? "checked" : ""} ${isOpen ? "open" : ""}`}
      style={{
        backgroundImage: `url(${imageConfig.src})`,
        backgroundPosition: imageConfig.position || "center"
      }}
      onClick={(event) => {
        if (event.target instanceof HTMLInputElement) return;
        onToggleOpen();
      }}
    >
      <div className="check-item-content">
        <input
          type="checkbox"
          checked={item.checked}
          disabled={!isAdmin}
          onChange={() => onToggleChecked(item)}
        />
        <div className="check-text">
          <div className="check-label">{item.label}</div>
          <div className="check-description">{item.description}</div>
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

        {children}
      </div>
    </div>
  );
}

export default CouponCard;
