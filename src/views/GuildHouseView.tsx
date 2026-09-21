/**
 * GuildHouseView.tsx - SCR-09-13, SCR-09-14, SCR-09-15
 * 길드 & 소셜 아지트 하우스 뷰 (CRDT 동기화, 그리드 인테리어 에디터, 영지 쟁탈전)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Swords, Crown, Sparkles, Home, Edit3, Shield, Trophy, 
  Settings, MessageSquare, ChevronLeft 
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { PageHeader } from '../components/PageHeader';
import { triggerHaptic } from '../lib/haptic';
import { GuildCrdtSync, GuildPlayerState } from '../lib/GuildCrdtSync';
import { EntityInterpolationEngine } from '../lib/EntityInterpolationEngine';
import { OffsetTouchPreview } from '../components/OffsetTouchPreview';
import { GuildRoomEditorDock } from '../components/GuildRoomEditorDock';
import { TerritoryWarLobbyModal } from '../components/TerritoryWarLobbyModal';

interface GuildHouseViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string, type?: 'earned' | 'purchased') => void;
  playSfx: (url: string) => void;
  onNavigate: (view: ViewType) => void;
  currentUser?: { uid: string; displayName: string } | null;
  guildName?: string;
}

export const GuildHouseView: React.FC<GuildHouseViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  onNavigate,
  currentUser,
  guildName = '불사조 기사단',
}) => {
  // CRDT Sync & Interpolation
  const localUid = currentUser?.uid || 'guest_hero';
  const crdtRef = useRef<GuildCrdtSync>(new GuildCrdtSync(localUid));
  const interpEngineRef = useRef<EntityInterpolationEngine>(new EntityInterpolationEngine());

  // Members in house
  const [players, setPlayers] = useState<GuildPlayerState[]>([]);
  const [localPos, setLocalPos] = useState({ x: 150, y: 150 });

  // Interior Edit Mode (SCR-09-14)
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState('황금 왕좌 제단');
  const [editGridPos, setEditGridPos] = useState({ x: 5, y: 5 });
  const [editRotation, setEditRotation] = useState(0);

  // Territory War Modal (SCR-09-15)
  const [isWarModalOpen, setIsWarModalOpen] = useState(false);
  const [placedFurnitureList, setPlacedFurnitureList] = useState<Array<{ name: string; x: number; y: number; rot: number }>>([
    { name: '길드 마스터 테이블', x: 4, y: 3, rot: 0 },
    { name: '승리의 트로피 진열대', x: 2, y: 2, rot: 90 },
    { name: '휴식용 안락의자', x: 6, y: 4, rot: 0 },
  ]);

  // Initial CRDT Setup & Mock P2P Peers
  useEffect(() => {
    const crdt = crdtRef.current;
    const interp = interpEngineRef.current;

    // Add local
    crdt.updateLocal(localPos.x, localPos.y);

    // Mock 3 remote guild members
    const mockRemotes: GuildPlayerState[] = [
      { uid: 'p1', name: '수호기사 레이', x: 80, y: 120, direction: 'right', timestamp: Date.now(), action: 'cheering' },
      { uid: 'p2', name: '마법소녀 루나', x: 220, y: 100, direction: 'down', timestamp: Date.now(), action: 'sitting' },
      { uid: 'p3', name: '바드 에릭', x: 190, y: 180, direction: 'left', timestamp: Date.now(), action: 'idle' },
    ];

    mockRemotes.forEach(r => {
      crdt.mergeRemote(r);
      interp.pushSample(r.uid, r.x, r.y);
    });

    setPlayers(crdt.getAllPlayers());

    // 60fps render interpolation loop
    let animId: number;
    const loop = () => {
      const now = Date.now();
      mockRemotes.forEach(r => {
        const interpolated = interp.getInterpolatedPosition(r.uid, now);
        if (interpolated) {
          crdt.mergeRemote({ ...r, x: interpolated.x, y: interpolated.y, timestamp: now });
        }
      });
      setPlayers(crdt.getAllPlayers());
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Moving local avatar in house
  const handleHouseTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setLocalPos({ x: clickX, y: clickY });
    crdtRef.current.updateLocal(clickX, clickY, 'walking');
    triggerHaptic('light');
  };

  // Furniture placement
  const handleConfirmPlacement = () => {
    setPlacedFurnitureList(prev => [
      ...prev,
      { name: selectedFurniture, x: editGridPos.x, y: editGridPos.y, rot: editRotation }
    ]);
    setIsEditing(false);
    triggerHaptic('heavy');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col select-none">
      <PageHeader
        title={language === 'ko' ? `[🏰 ${guildName} 아지트]` : `[🏰 ${guildName} Hall]`}
        description={language === 'ko' ? '60fps CRDT 멀티 동기화 & 영지 쟁탈전' : '60fps CRDT Guild House & Territory War'}
        onBack={() => onNavigate('guild-detail')}
        rightElement={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsWarModalOpen(true)}
              className="px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black rounded-lg flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Swords size={13} />
              <span>영지전</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setIsEditing(!isEditing);
              }}
              className={`px-2.5 py-1.5 text-xs font-black rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 ${
                isEditing ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Edit3 size={13} />
              <span>{isEditing ? '완료' : '배치'}</span>
            </button>
          </div>
        }
      />

      {/* Main Guild Hall Interactive Stage */}
      <div className="flex-1 relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-2">
        {/* Isometric / Top-down room floor */}
        <div
          onClick={handleHouseTap}
          className="relative w-full max-w-md h-[400px] bg-slate-950/80 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl cursor-crosshair"
          style={{
            backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Room Banner */}
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 border border-slate-700 rounded-full text-[10px] text-amber-400 font-bold flex items-center gap-1">
            <Users size={12} />
            <span>동시 접속 길드원: {players.length}명</span>
          </div>

          {/* Placed Furnitures */}
          {placedFurnitureList.map((item, idx) => (
            <div
              key={idx}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 text-center"
              style={{
                left: `${item.x * 32 + 20}px`,
                top: `${item.y * 32 + 20}px`,
                transform: `rotate(${item.rot}deg)`,
              }}
            >
              <div className="text-2xl drop-shadow-md">🛋️</div>
              <span className="text-[9px] text-amber-300 font-bold block bg-black/70 px-1 rounded -mt-1">
                {item.name}
              </span>
            </div>
          ))}

          {/* CRDT Synchronized Players */}
          {players.map((p) => {
            const isMe = p.uid === localUid;
            return (
              <div
                key={p.uid}
                className="absolute transition-all duration-100 ease-linear pointer-events-none -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${p.x}px`, top: `${p.y}px` }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-black shadow-lg ${
                    isMe
                      ? 'bg-amber-400 text-slate-950 border-white animate-pulse'
                      : 'bg-indigo-600 text-white border-indigo-300'
                  }`}
                >
                  {isMe ? '나' : '원'}
                </div>
                <span className="text-[9px] text-white font-bold bg-black/60 px-1 rounded mt-0.5 whitespace-nowrap">
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Instructions banner */}
        {!isEditing && (
          <div className="mt-3 text-center text-[11px] text-slate-400">
            💡 바닥을 탭하여 아지트를 이동하고, 상단 [배치] 버튼을 눌러 가구를 배치하세요.
          </div>
        )}
      </div>

      {/* SCR-09-14: Offset Touch Preview */}
      <OffsetTouchPreview
        visible={isEditing}
        furnitureName={selectedFurniture}
        gridX={editGridPos.x}
        gridY={editGridPos.y}
        rotation={editRotation}
      />

      {/* SCR-09-14: Guild Room Editor Dock */}
      {isEditing && (
        <GuildRoomEditorDock
          selectedFurniture={selectedFurniture}
          gridX={editGridPos.x}
          gridY={editGridPos.y}
          rotation={editRotation}
          onMoveGrid={(dx, dy) => {
            setEditGridPos(prev => ({
              x: Math.max(1, Math.min(10, prev.x + dx)),
              y: Math.max(1, Math.min(10, prev.y + dy)),
            }));
          }}
          onRotate={() => setEditRotation(prev => (prev + 90) % 360)}
          onConfirm={handleConfirmPlacement}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* SCR-09-15: Territory War Lobby Modal */}
      <TerritoryWarLobbyModal
        isOpen={isWarModalOpen}
        onClose={() => setIsWarModalOpen(false)}
        guildName={guildName}
        onStartBattle={(nodeName) => {
          setIsWarModalOpen(false);
          triggerHaptic('heavy');
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }}
        onBuyChampagnePack={() => {
          updateSns(-300, '[길드 챔피언 축하 샴페인 파티팩 구매]');
        }}
      />
    </div>
  );
};
