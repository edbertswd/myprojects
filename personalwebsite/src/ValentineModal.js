import React, { useState } from "react";
import { motion } from "framer-motion";
import "./FloatingHeart.css";

const FloatingHeart = () => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <motion.div
        className="floating-heart"
        whileHover={{ scale: 1.2 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        onClick={handleClick}
      >
        ❤️
      </motion.div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Will you be my Valentine? 💖</h2>
            <div className="modal-buttons">
              <button onClick={() => alert("Yay! ❤️")}>Yes</button>
              <button onClick={() => alert("Aww 😢")}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingHeart;
