import React, { useState, useEffect } from 'react';
import { ViewType, Language } from '../types';
import { Copy, Check, ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface PacpikViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
}

const VERIFICATION_CODE = 'f197d6f47d819f97660046da45174f0d5a9ff1abf90c5e38';
const FULL_VERIFICATION_STRING = `pacpik-games-verification=${VERIFICATION_CODE}`;

export const PacpikView: React.FC<PacpikViewProps> = ({ language, onNavigate }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Pacpik Games Verification | SNSHero';

    let meta = document.querySelector('meta[name="pacpik-games-verification"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'pacpik-games-verification');
      meta.setAttribute('content', VERIFICATION_CODE);
      document.head.appendChild(meta);
    }
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(FULL_VERIFICATION_STRING);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = FULL_VERIFICATION_STRING;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col justify-between p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto pt-6">
        <PageHeader
          title="PACPIK VERIFICATION"
          subtitle="Domain Ownership Verification"
          language={language}
          onBack={() => onNavigate('home')}
        />

        <div className="mt-6 border border-[rgba(15,0,0,0.12)] bg-white p-6 md:p-8 rounded-none shadow-none">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              [STATUS: ACTIVE VERIFICATION]
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-[#201d1d] mb-2">
            Pacpik Games Domain Verification
          </h1>
          <p className="text-sm text-[#201d1d]/60 mb-6">
            Domain ownership verification string for SNSHero (<span className="text-[#201d1d] font-semibold">https://snshero.com</span>).
          </p>

          {/* Raw verification text block for verification crawlers */}
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider text-[#201d1d]/60 mb-2">
              Raw Verification String
            </label>
            <div
              id="rawToken"
              className="p-3.5 bg-[#faf9f7] border border-dashed border-[rgba(15,0,0,0.2)] text-xs font-mono text-[#201d1d] break-all select-all rounded-sm"
            >
              {FULL_VERIFICATION_STRING}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider text-[#201d1d]/60 mb-2">
              Verification Token
            </label>
            <div className="p-3 bg-[#f5f4f2] border border-[rgba(15,0,0,0.12)] text-xs md:text-sm font-semibold text-[#201d1d] break-all select-all rounded-sm">
              {VERIFICATION_CODE}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#201d1d] text-white hover:bg-[#201d1d]/90 font-medium text-xs md:text-sm rounded-sm transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>[✓] Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>[+] Copy Verification String</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#201d1d]/5 font-medium text-xs md:text-sm rounded-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to SNSHero</span>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-[rgba(15,0,0,0.12)] flex flex-wrap justify-between items-center text-xs text-[#201d1d]/50 gap-2">
            <span>Service: SNSHero Revolution</span>
            <span>Host: snshero.com</span>
            <span className="inline-flex items-center gap-1">
              Path: /pacpik
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-[#201d1d]/40 py-6">
        SNSHero Revolution &copy; {new Date().getFullYear()} &bull; Domain Verification Endpoint
      </footer>
    </div>
  );
};

export default PacpikView;
