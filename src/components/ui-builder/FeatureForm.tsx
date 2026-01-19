'use client';

import { ComponentOption } from '@/lib/ui-builder-config';

interface FeatureFormProps {
  component: ComponentOption;
  choices: Record<string, string | boolean>;
  onChange: (featureId: string, value: string | boolean) => void;
}

export function FeatureForm({ component, choices, onChange }: FeatureFormProps) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 h-full">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        {(() => {
          const Icon = component.icon as any;
          return <Icon className="w-6 h-6 text-emerald-600" />;
        })()}
        Configure {component.label}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {component.features.map((feature) => (
          <div key={feature.id} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {feature.label}
            </label>
            
            {feature.type === 'select' && feature.options ? (
              <div className="relative">
                <select
                  value={(choices[feature.id] as string) || feature.options[0]}
                  onChange={(e) => onChange(feature.id, e.target.value)}
                  className="w-full px-4 py-2 appearance-none bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-700"
                >
                  {feature.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            ) : feature.type === 'boolean' ? (
               <button
                onClick={() => onChange(feature.id, !choices[feature.id])}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  choices[feature.id] ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={Boolean(choices[feature.id])}
              >
                <span className="sr-only">Enable {feature.label}</span>
                <span
                  className={`${
                    choices[feature.id] ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md`}
                />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
