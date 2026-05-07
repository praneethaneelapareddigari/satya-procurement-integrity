import React, { useState } from 'react';
import { AlertTriangle, Shield, Eye } from 'lucide-react';

const SEVERITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-50 border-red-200 text-red-800',
  MEDIUM: 'bg-amber-50 border-amber-200 text-amber-800',
  LOW: 'bg-blue-50 border-blue-200 text-blue-800',
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  document_similarity: '📄 Document Similarity',
  duplicate_entity: '🔍 Duplicate Entity (GST/PAN)',
  metadata_anomaly: '⚠️ Metadata Anomaly',
};

export default function RiskSignals({ signals }: { signals: any[] }) {
  const [responses, setResponses] = useState<Record<number, string>>({});

  if (!signals || signals.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
        <Shield className="w-12 h-12 text-green-300 mx-auto mb-3" />
        <p className="text-gray-500">No risk signals detected across bidder submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600">
          <strong>{signals.length} risk signal{signals.length > 1 ? 's' : ''}</strong> detected across bidder submissions.
          All signals are <strong>advisory</strong> — they inform your review but do not automatically disqualify any bidder.
        </p>
      </div>

      {signals.map((signal, i) => (
        <div key={i} className={`rounded-xl p-5 shadow-sm border ${SEVERITY_STYLES[signal.severity]}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold text-sm">{SIGNAL_TYPE_LABELS[signal.signal_type] || signal.signal_type}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${SEVERITY_STYLES[signal.severity]}`}>
              {signal.severity}
            </span>
          </div>

          <p className="text-sm mb-3">{signal.description}</p>

          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-medium">Bidders Involved: </span>
            {signal.bidders_involved.map((b: string) => (
              <span key={b} className="bg-white/60 rounded px-2 py-0.5 text-xs font-medium border">{b}</span>
            ))}
          </div>

          <div className="bg-white/60 rounded-lg p-3 mb-3 border">
            <p className="text-xs font-semibold mb-1">Recommended Action</p>
            <p className="text-sm">{signal.recommended_action}</p>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1">Officer Response (logged in audit report)</p>
            <textarea
              className="w-full bg-white/80 border rounded-lg p-2 text-sm resize-none focus:outline-none"
              rows={2}
              placeholder="Document your response to this signal..."
              value={responses[i] || ''}
              onChange={(e) => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
