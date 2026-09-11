import React, { useEffect } from 'react';

const VERIFICATION_TEXT = 'pacpik-games-verification=f197d6f47d819f97660046da45174f0d5a9ff1abf90c5e38';

export const PacpikView: React.FC = () => {
  useEffect(() => {
    document.title = VERIFICATION_TEXT;
  }, []);

  return (
    <pre style={{
      fontFamily: 'monospace',
      fontSize: '14px',
      margin: 0,
      padding: '16px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      background: '#ffffff',
      color: '#000000',
    }}>
      {VERIFICATION_TEXT}
    </pre>
  );
};

export default PacpikView;
