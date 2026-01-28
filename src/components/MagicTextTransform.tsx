'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const transformations = [
  {
    before: "Luxury Candle - Sandalwood - Wholesale $15.00 - SKU: LC-SND-01",
    after: "Handle: luxury-candle-sandalwood | Title: [Brand] Artisan Sandalwood Candle - Hand-Poured Soy Wax - 12oz | Price: $30.00 | Type: Home & Garden > Decor > Candles",
    category: "Multichannel Architect"
  },
  {
    before: "Pro Chef Knife Set - 8pcs - Steel - Sharp",
    after: "Amazon Title: [Brand] Professional 8-Piece Chef Knife Set - High-Carbon German Steel - Ultra-Sharp Culinary Essentials - Model K800 | Bullet 1: PREMIUM MATERIAL: Forged from high-carbon X50CrMoV15 German steel for superior edge retention.",
    category: "Amazon Optimization"
  },
  {
    before: "Stock check: 0 items for SKU 9920",
    after: "Inventory Sync: SKU 9920 | Status: Out of Stock | Shopify Action: Set to 0 | Amazon Action: Close Listing | Note: Safely synchronized across all channels.",
    category: "Sync Audit"
  }
];

export default function MagicTextTransform() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransformed, setIsTransformed] = useState(false);

  useEffect(() => {
    const transformTimer = setTimeout(() => {
      setIsTransformed(true);
    }, 500);

    const cycleTimer = setTimeout(() => {
      setIsTransformed(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % transformations.length);
      }, 400);
    }, 500);

    return () => {
      clearTimeout(transformTimer);
      clearTimeout(cycleTimer);
    };
  }, [currentIndex]);

  const current = transformations[currentIndex];

  return (
    <div className="absolute top-1/5 -translate-y-1/2 right-10 md:right-10 w-[320px] pointer-events-none z-0 hidden lg:block">
      <div className="relative">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-6 left-0 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200"
        >
          <Sparkles className="w-2.5 h-2.5" />
          {current.category}
        </motion.div>


        <div className="relative bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/60 shadow-xl shadow-slate-900/10">
          
          <AnimatePresence mode="wait">
            {!isTransformed ? (
              <motion.div
                key="before"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="space-y-2"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Before</div>
                <p className="text-slate-600 font-mono text-xs leading-relaxed">
                  {current.before}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="after"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.1 }}
                className="space-y-2"
              >
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  After
                </div>
                <motion.p 
                  className="text-slate-900 text-xs leading-relaxed font-medium"
                  initial={{ backgroundPosition: "0% 50%" }}
                  animate={{ backgroundPosition: "100% 50%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  style={{
                    background: "linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}
                >
                  {current.after}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Magic Particles */}
          <AnimatePresence>
            {isTransformed && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: 0,
                      y: 0
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: Math.cos((i / 8) * Math.PI * 2) * 60,
                      y: Math.sin((i / 8) * Math.PI * 2) * 60
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full"
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Progress Indicator */}
          <div className="flex gap-1 mt-4">
            {transformations.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  idx === currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Glow Effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-xl blur-xl -z-10"
          animate={{
            opacity: isTransformed ? [0.3, 0.6, 0.3] : 0.2,
            scale: isTransformed ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
    </div>
  );
}
