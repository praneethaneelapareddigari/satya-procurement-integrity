import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BidderCardProps {
  result: any;
  isSelected: boolean;
  onClick: () => void;
  verdictStyles: Record<string, string>;
  verdictIcons: Record<string, React.ReactNode>;
  onVerdictClick: (verdict: any) => void;
}

export default function BidderCard({ result, isSelected, onClick, verdictStyles, verdictIcons }: BidderCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-100 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">{result.bidder_name}</h3>
        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${verdictStyles[result.overall_verdict]}`}>
          {verdictIcons[result.overall_verdict]}
          {result.overall_verdict.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-500">
          {(result.overall_confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {result.criterion_verdicts.map((v: any) => (
          <span
            key={v.criterion_code}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs border ${verdictStyles[v.verdict]}`}
            title={`${v.criterion_code}: ${v.verdict}`}
          >
            {v.criterion_code}
          </span>
        ))}
      </div>
    </div>
  );
}
