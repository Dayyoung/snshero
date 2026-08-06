import React from 'react';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';

interface UpgradeMapping {
  idx: number;
  imgIdx: number;
}

interface DeckUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language: string;
  upgradedCards: UpgradeMapping[];
  currentDeck: (any | null)[];
}

export const DeckUpgradeModal: React.FC<DeckUpgradeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  language,
  upgradedCards,
  currentDeck,
}) => {
  if (!isOpen || upgradedCards.length === 0) return null;

  // Rarity에 따른 그라데이션 스타일 헬퍼
  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'gold':
        return 'linear-gradient(135deg, #fbbf24, #b45309)';
      case 'silver':
        return 'linear-gradient(135deg, #cbd5e1, #64748b)';
      case 'bronze':
      case 'common':
        return 'linear-gradient(135deg, #c27a3a, #8c4f1d)';
      default:
        // rare, legendary, platinum
        return 'linear-gradient(135deg, #ec4899, #8b5cf6)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(7, 10, 19, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.05)',
          padding: '24px',
          color: '#ffffff',
          fontFamily: "'Inter', 'Outfit', sans-serif",
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Glow Accent Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)',
          }}
        />

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {t('deck_upgrade_available', language)}
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
            {t('upgrade_deck_confirm', language)}
          </p>
        </div>

        {/* Cards Comparison List */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {upgradedCards.map((mapping, idx) => {
            const currentCard = currentDeck[mapping.idx];
            const currentCardImgIdx = currentCard?.imageIndex || 0;
            const currentDb = CARD_DATABASE[currentCardImgIdx];
            const currentName = currentDb ? (language === 'ko' ? currentDb.title : currentDb.title_dis) : `Slot ${mapping.idx + 1}`;
            const currentPower = currentCard ? (currentCard.power || currentDb?.power || 0) : 0;
            const currentRarity = currentCard?.rarity || 'bronze';

            const newDb = CARD_DATABASE[mapping.imgIdx];
            const newName = newDb ? (language === 'ko' ? newDb.title : newDb.title_dis) : `New Card`;
            const newPower = newDb ? newDb.power : 0;
            const newRarity = newDb ? newDb.rarity : 'bronze';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #8b5cf6',
                }}
              >
                {/* Current Card */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#6b7280',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    Slot {mapping.idx + 1}
                  </span>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#9ca3af',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentName}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      background: getRarityGradient(currentRarity),
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontWeight: 'bold',
                      marginRight: '6px',
                      display: 'inline-block',
                      marginTop: '4px',
                    }}
                  >
                    {currentRarity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>
                    {currentPower}
                  </span>
                </div>

                {/* Arrow */}
                <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', color: '#a78bfa', fontWeight: 'bold' }}>➔</span>
                </div>

                {/* New Card */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#a78bfa',
                      display: 'block',
                      marginBottom: '2px',
                      fontWeight: 'bold',
                    }}
                  >
                    UPGRADE
                  </span>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {newName}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      background: getRarityGradient(newRarity),
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontWeight: 'bold',
                      marginRight: '6px',
                      display: 'inline-block',
                      marginTop: '4px',
                    }}
                  >
                    {newRarity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 'bold' }}>
                    {newPower}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9ca3af',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            {t('no', language)}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
          >
            {t('yes', language)}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
