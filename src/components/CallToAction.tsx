import React from 'react';
import { motion } from 'framer-motion';

interface CallToActionProps {
  children: React.ReactNode;
}

export const CallToAction: React.FC<CallToActionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      {children}
    </motion.div>
  );
};
