'use client';

import { ComponentOption, UI_COMPONENTS } from '@/lib/ui-builder-config';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ComponentSelectorProps {
  selectedId: string | null;
  onSelect: (component: ComponentOption) => void;
}

export function ComponentSelector({ selectedId, onSelect }: ComponentSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {UI_COMPONENTS.map((component) => {
        const Icon = component.icon;
        const isSelected = selectedId === component.id;

        return (
          <motion.button
            key={component.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(component)}
            className={cn(
              "flex flex-col items-center justify-center p-6 transition-all duration-200 border-2 rounded-xl h-40 w-full",
              "bg-white shadow-sm hover:shadow-md cursor-pointer",
              isSelected 
                ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                : "border-gray-100 text-gray-600 hover:border-emerald-200 hover:text-emerald-600"
            )}
          >
            {(() => {
              const Icon = component.icon as any;
              return <Icon className={cn("w-12 h-12 mb-3", isSelected ? "text-emerald-600" : "text-gray-400")} />;
            })()}
            <span className="font-semibold">{component.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
