import React, { useState } from "react";
import { motion } from "framer-motion";
import "./FloatingHeart.css"; // Ensure this file is linked correctly

const FloatingHeart = () => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      {/* Floating heart animation */}
      <motion.div
        className="floating-heart"
        whileHover={{ scale: 2.0}}
        animate={{ y: [0, -20, 0] }} // More noticeable floating effect
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        onClick={handleClick}
      >
        ❤️
      </motion.div>

      {/* Modal overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Will you be my Valentine? 💖</h2>
            <div className="modal-buttons">
              <button onClick={() => alert("Yay! ❤️")}>Yes</button>
              <button onClick={() => alert("Aww 😢")}>Yes please.</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingHeart;
