import React, { useEffect, useRef, useLayoutEffect, useState } from "react";
import "../styles/CustomModal.css";

const CustomModal = ({ show, onClose, title, children, actions, icon, anchorY }) => {
  const modalRef = useRef(null);
  const [modalTop, setModalTop] = useState(null);

  useLayoutEffect(() => {
    if (show && anchorY !== null && modalRef.current) {
      const modalHeight = modalRef.current.offsetHeight;
      let top = anchorY - modalHeight / 2;
      if (top < 16) top = 16;
      if (top + modalHeight > window.innerHeight - 16) top = window.innerHeight - modalHeight - 16;
      setModalTop(top);
    } else {
      setModalTop(null);
    }
  }, [show, anchorY, children]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;
  const overlayStyle = {
    position: 'fixed',
    left: '50%',
    top: modalTop !== null ? modalTop : '50%',
    transform: modalTop !== null ? 'translateX(-50%)' : 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    zIndex: 9999,
    background: 'transparent',
    padding: 0,
    margin: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  };
  return (
    <div className="custom-modal-backdrop" onClick={onClose} style={overlayStyle}>
      <div className="custom-modal-wrap" ref={modalRef} style={{
        maxWidth: 340,
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        boxSizing: 'border-box'
      }} onClick={e => e.stopPropagation()}>
        <button className="custom-modal-close" onClick={onClose}>&times;</button>
        {title && (
          <h2 className="custom-modal-header">
            {icon && <span className="modal-icon">{icon}</span>}
            {title}
          </h2>
        )}
        <div className="custom-modal-content">{children}</div>
        {actions && <div className="custom-modal-actions">{actions}</div>}
      </div>
    </div>
  );
};

export default CustomModal; 