import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, ChevronRight, Eye } from 'lucide-react';

interface EvidenceViewerProps {
  bidder: any;
  verdictStyles: Record<string, string>;
  verdictIcons: Record<string, React.ReactNode>;
  selectedVerdict: any;
  onVerdictSelect: (v: any) => void;
}

const MOCK_DOCUMENT_EXCERPTS: Record<string, Record<string, { highlight: string; context: string; source: string }>> = {
  "ABC Construction Ltd": {
    "C1": {
      highlight: "Rs. 7.2 CRORE",
      context: "ABC Construction Ltd Annual Report FY 2024-25. Total turnover for the financial year ended 31st March 2025 was",
      source: "financial_statement.pdf — Page 1"
    },
    "C2": {
      highlight: "4 projects found (2022-2025)",
      context: "This is to certify that ABC Construction Ltd has successfully completed the following projects: 1. Boundary wall construction at CISF Camp, Pune (2022) 2. Security infrastructure at BSF HQ, Delhi (2023) 3. Perimeter fencing at CRPF Training Centre, Hyderabad (2024) 4. Guard post construction at Police Academy, Bengaluru (2025)",
      source: "experience_letter.pdf — Page 1"
    },
    "C3": {
      highlight: "GSTIN: 29AABCA1234R1ZX — ACTIVE",
      context: "GST Registration Certificate. Legal Name: ABC Construction Ltd. Registration Date: 01/07/2017.",
      source: "gst_certificate.pdf — Page 1"
    },
    "C4": {
      highlight: "ISO 9001:2015 [LOW CONFIDENCE — 61%]",
      context: "ISO 9001 2015 Certificate ABC Construction Ltd Quality Management System Certificate Number QMS-2024-0891 Valid Until December 2026 [OCR confidence: 61% — document is a photograph]",
      source: "iso_certificate_scan.jpg — OCR"
    },
    "C5": {
      highlight: "73 employees",
      context: "Company maintains a permanent workforce of 73 employees across all project sites as certified by HR department.",
      source: "experience_letter.pdf — Page 2"
    }
  },
  "XYZ Infrastructure Pvt Ltd": {
    "C1": {
      highlight: "Rs. 3.1 crore — BELOW THRESHOLD",
      context: "XYZ Infrastructure Pvt Ltd. Annual turnover FY 2024-25: Rs. 3.1 crore. FY 2023-24: Rs. 2.8 crore. FY 2022-23: Rs. 2.4 crore. [Required: Rs. 5 crore — NOT MET]",
      source: "financials_xyz.pdf — Page 1"
    },
    "C2": {
      highlight: "2 projects found — BELOW MINIMUM",
      context: "Project Experience: 1. Road construction project, Pune Municipal Corp - Rs. 1.8 crore (2024). 2. Bridge repair work, NHAI - Rs. 2.1 crore (2023). [Required: 3 similar projects — NOT MET]",
      source: "projects_xyz.docx"
    },
    "C3": {
      highlight: "GSTIN: 27AABCX5678Q1ZY — ACTIVE",
      context: "GST Registration. GSTIN: 27AABCX5678Q1ZY. Legal Name: XYZ Infrastructure Pvt Ltd. Status: Active.",
      source: "gst_xyz.pdf — Page 1"
    },
    "C4": {
      highlight: "NO DOCUMENT FOUND",
      context: "ISO 9001 certificate was not included in the submission package. Criterion cannot be evaluated without the required document.",
      source: "— Document not submitted —"
    },
    "C5": {
      highlight: "NO DOCUMENT FOUND",
      context: "Employee records were not included in the submission package. Optional criterion cannot be verified.",
      source: "— Document not submitted —"
    }
  },
  "PQR Builders": {
    "C1": {
      highlight: "Rs. ~6 crore [UNREADABLE — OCR 58%]",
      context: "PQR Builders Turnover Annual Rs crore 2024 6 [unclear text] certified accounts [Document is a low-quality scan — figures cannot be verified with confidence]",
      source: "financial_pqr.pdf — OCR (LOW CONFIDENCE 58%)"
    },
    "C2": {
      highlight: "3 projects found",
      context: "PQR Builders project experience: 1. Construction of security wall at Central University - Rs. 2.5 crore (2023). 2. Boundary fencing at Industrial Estate - Rs. 3.0 crore (2022). 3. CRPF accommodation block - Rs. 2.2 crore (2024).",
      source: "exp_pqr.pdf — Page 1"
    },
    "C3": {
      highlight: "⚠️ GSTIN: 29AABCA1234R1ZX — DUPLICATE!",
      context: "GSTIN: 29AABCA1234R1ZX. Legal Name: PQR Builders. Status: Active. ⚠️ WARNING: This GSTIN is identical to ABC Construction Ltd's registration. This is a critical fraud signal.",
      source: "gst_pqr.pdf — Page 1 [RISK FLAG]"
    },
    "C4": {
      highlight: "NO DOCUMENT FOUND",
      context: "ISO 9001 certificate was not included in the submission package.",
      source: "— Document not submitted —"
    },
    "C5": {
      highlight: "NO DOCUMENT FOUND",
      context: "Employee records were not included in the submission package.",
      source: "— Document not submitted —"
    }
  }
};

export default function EvidenceViewer({ bidder, verdictStyles, verdictIcons, selectedVerdict, onVerdictSelect }: EvidenceViewerProps) {
  const [officerNote, setOfficerNote] = useState('');
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const activeVerdict = selectedVerdict || bidder.criterion_verdicts[0];
  const excerpts = MOCK_DOCUMENT_EXCERPTS[bidder.bidder_name] || {};
  const activeExcerpt = excerpts[activeVerdict?.criterion_code];

  const applyOverride = (code: string, newVerdict: string) => {
    setOverrides(prev => ({ ...prev, [code]: newVerdict }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
      {/* Bidder Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4">
        <h3 className="font-bold text-lg">{bidder.bidder_name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 border border-white/30 text-white`}>
            {verdictIcons[bidder.overall_verdict]}
            {bidder.overall_verdict.replace('_', ' ')}
          </span>
          <span className="text-blue-200 text-xs">{(bidder.overall_confidence * 100).toFixed(0)}% avg confidence</span>
        </div>
      </div>

      <div className="flex h-full">
        {/* LEFT: Criteria Verdict List */}
        <div className="w-44 border-r border-gray-100 overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Criteria</p>
            {bidder.criterion_verdicts.map((v: any) => (
              <button
                key={v.criterion_code}
                onClick={() => onVerdictSelect(v)}
                className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                  activeVerdict?.criterion_code === v.criterion_code
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-gray-700">{v.criterion_code}</span>
                  <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs border ${verdictStyles[overrides[v.criterion_code] || v.verdict]}`}>
                    {verdictIcons[overrides[v.criterion_code] || v.verdict]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{v.criterion_description?.split(' ').slice(0, 4).join(' ')}...</p>
                {!v.is_mandatory && <span className="text-xs text-gray-400">optional</span>}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Evidence Detail */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeVerdict && (
            <>
              {/* Verdict Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-800">{activeVerdict.criterion_code} — {activeVerdict.criterion_description}</h4>
                  <span className="text-xs text-gray-500">{activeVerdict.is_mandatory ? 'MANDATORY' : 'OPTIONAL'}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${verdictStyles[overrides[activeVerdict.criterion_code] || activeVerdict.verdict]}`}>
                  {verdictIcons[overrides[activeVerdict.criterion_code] || activeVerdict.verdict]}
                  {(overrides[activeVerdict.criterion_code] || activeVerdict.verdict).replace('_', ' ')}
                </span>
              </div>

              {/* Confidence Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>AI Confidence</span>
                  <span className="font-medium">{(activeVerdict.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${activeVerdict.confidence >= 0.85 ? 'bg-green-500' : activeVerdict.confidence >= 0.60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${activeVerdict.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Document Viewer */}
              {activeExcerpt && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-medium">{activeExcerpt.source}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">{activeExcerpt.context}</p>
                  <div className="bg-yellow-100 border border-yellow-300 rounded px-3 py-2">
                    <p className="text-sm font-bold text-yellow-900">📌 {activeExcerpt.highlight}</p>
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Reasoning</p>
                <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                  {activeVerdict.reasoning}
                </p>
              </div>

              {/* Missing Info */}
              {activeVerdict.missing_info && (
                <div className="mb-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 mb-1">📋 Action Required</p>
                  <p className="text-sm text-amber-800">{activeVerdict.missing_info}</p>
                </div>
              )}

              {/* Officer Actions */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Officer Action</p>
                <div className="flex gap-2 mb-3">
                  {['ELIGIBLE', 'NOT_ELIGIBLE', 'NEEDS_REVIEW'].map(v => (
                    <button
                      key={v}
                      onClick={() => applyOverride(activeVerdict.criterion_code, v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        (overrides[activeVerdict.criterion_code] || activeVerdict.verdict) === v
                          ? verdictStyles[v] + ' font-bold'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {v.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400"
                  rows={2}
                  placeholder="Add officer note (logged in audit report)..."
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
