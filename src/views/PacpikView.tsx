import React, { useEffect } from 'react';

const VERIFICATION_TEXT = 'pacpik-games-verification=1a69b39b20f76c21ab6e49dc8dc6c9c42d5f83d54c2dc5b6';

export const PacpikView: React.FC = () => {
  useEffect(() => {
    document.title = VERIFICATION_TEXT;
  }, []);

  return (
    <div className="w-full min-h-screen font-mono overflow-x-hidden pb-28 bg-white">
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
    </div>
  );
};

export default PacpikView;
