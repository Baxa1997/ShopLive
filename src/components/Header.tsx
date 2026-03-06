import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  description: string;
}

export const Header: React.FC<HeaderProps> = ({ title, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-10 text-center"
    >
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
        {title}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-lg">
        {description}
      </p>
    </motion.div>
  );
};
