import React, { useState } from "react";
import { motion } from "framer-motion";
import "./FloatingHeart.css"; // Ensure this file is linked correctly

const FloatingHeart = () => {
  const [showModal, setShowModal] = useState(false);
  const [showFace, setShowFace] = useState(false); // State to handle face visibility

  const handleClick = () => {
    setShowModal(true);
  };

  const handleYesClick = () => {
    setShowFace(true); // Show face when "Yes" is clicked
    setTimeout(() => {
      alert("Yay! ❤️");
      setShowModal(false); // Close modal after a short delay
    }, 500); // Short delay before showing the alert and closing the modal
  };

  return (
    <>
      {/* Floating heart animation */}
      <motion.div
        className="floating-heart"
        whileHover={{ scale: 1.2 }}
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
              <button onClick={handleYesClick}>Yes</button>
              <button onClick={() => alert("Aww 😢")}>No</button>
            </div>
            {showFace && (
              <motion.div
                className="face-popup"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3>😊</h3> {/* This is the face emoji, you can replace it with an image */}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingHeart;
