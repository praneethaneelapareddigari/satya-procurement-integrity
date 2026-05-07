import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

export default function CriteriaPanel({ criteria }: { criteria: any[] }) {
  const mandatory = criteria.filter(c => c.is_mandatory);
  const optional = criteria.filter(c => !c.is_mandatory);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Extracted Criteria</h3>

      <div className="space-y-1 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Mandatory ({mandatory.length})</p>
        {mandatory.map(c => (
          <div key={c.code} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-xs text-gray-700">{c.code}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  c.category === 'Financial' ? 'bg-blue-100 text-blue-700' :
                  c.category === 'Technical' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>{c.category}</span>
              </div>
              <p className="text-xs text-gray-700">{c.description}</p>
              {c.threshold_value && (
                <p className="text-xs text-gray-500 mt-0.5">Required: {c.threshold_value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {optional.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Optional ({optional.length})</p>
          {optional.map(c => (
            <div key={c.code} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-xs text-gray-700">{c.code}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600">{c.category}</span>
                </div>
                <p className="text-xs text-gray-600">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
