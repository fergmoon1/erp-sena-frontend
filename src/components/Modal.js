import React from "react";
import "../styles/Modal.css";

const Modal = ({ show, onClose, title, children, color = "#f44336" }) => {
  if (!show) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ borderTop: `6px solid ${color}` }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {title && <h3 className="modal-title">{title}</h3>}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal; 