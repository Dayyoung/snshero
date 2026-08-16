import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Zap, Heart, Skull } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { CardData, Language } from '../types';
import { t } from '../lib/i18n';

interface ShootingBattleGameProps {
  deck: CardData[];
  language: Language;
  playerName?: string;
  lowSpecMode?: boolean;
  currentSeason?: string;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
}

type EnemyState = 'enter' | 'formation' | 'dive';

interface Enemy {
  cardId: number;
  hp: number;
  maxHp: number;
  state: EnemyState;
  formationX: number;
  formationY: number;
  x: number;
  y: number;
  enterTimer: number;
  enterDelay: number;
  diveProgress: number;
  diveTimer: number;
  hasShot: boolean;
  diveDir: number;
}

interface Particle {
  x: number;
  y: number;
  cardId: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
}

interface PowerUpItem {
  x: number;
  y: number;
  type: 'heal' | 'rapid' | 'spread';
  vy: number;
}

const CANVAS_W = 400;
const CANVAS_H = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ENEMY_BULLET_SPEED = 3;
const SHOOT_INTERVAL = 200;
const RAPID_SHOOT_INTERVAL = 100;
const MAX_STAGES = 110;
const MAX_PARTICLES = 20;
const POWERUP_CHANCE = 0.15;
const FORMATION_SWAY_SPEED = 0.0008;
const FORMATION_SWAY_AMP = 30;

const HIT_RADIUS_PLAYER = 14;
const HIT_RADIUS_BULLET_ENEMY = 22;
const HIT_RADIUS_POWERUP = 26;
const HIT_RADIUS_ENEMY_BODY = 18;
const TOUCH_OFFSET_Y = 70;

const getStageConfig = (stage: number) => {
  const count = Math.min(3 + Math.floor(stage * 0.1), 14);
  const hp = 1 + Math.floor(stage / 20);
  const shootInterval = Math.max(2200 - stage * 16, 500);
  const diveMin = Math.max(4000 - stage * 25, 1500);
  const diveMax = Math.max(7000 - stage * 40, 2500);
  const diveCooldown = Math.max(1800 - stage * 10, 600);
  const diveDuration = Math.max(2500 - stage * 10, 1200);
  const enemyBulletSpeed = Math.min(3 + stage * 0.01, 5);
  return { count, hp, shootInterval, diveMin, diveMax, diveCooldown, diveDuration, enemyBulletSpeed };
};

const getCardName = (cardId: number, language: Language): string => {
  const card = CARD_DATABASE[cardId];
  if (!card) return `#${cardId}`;
  if (language === 'ko' || language === 'ja') return card.title_dis || card.title_en;
  return card.title_en || card.title_dis || `#${cardId}`;
};

interface ShootingLeaderBonus {
  maxHp: number;
  rapidStartMs: number;
  scoreMultiplier: number;
  powerUpChance: number;
}

interface ShootingSeasonRule {
  id: string;
  scoreBonusPerMilestone: number;
  rapidBoostMs: number;
}

const DEFAULT_SEASON_RULE: ShootingSeasonRule = {
  id: 'season1',
  scoreBonusPerMilestone: 60,
  rapidBoostMs: 3000,
};

const getLeaderBonus = (cardId: number): ShootingLeaderBonus => {
  const card = CARD_DATABASE[cardId];
  if (!card) {
    return { maxHp: 5, rapidStartMs: 0, scoreMultiplier: 1, powerUpChance: POWERUP_CHANCE };
  }

  const rarityRapidBoost = card.rarity === 'gold' ? 5000 : card.rarity === 'silver' ? 2500 : 0;
  const elementPowerUpBoost = card.element === 'water'
    ? 0.05
    : card.element === 'air'
      ? 0.03
      : 0.02;
  const scoreMultiplier = card.rarity === 'gold' ? 1.15 : card.rarity === 'silver' ? 1.08 : 1.03;
  const maxHp = (card.power ?? 0) >= 26 ? 6 : 5;

  return {
    maxHp,
    rapidStartMs: rarityRapidBoost,
    scoreMultiplier,
    powerUpChance: Math.min(0.4, POWERUP_CHANCE + elementPowerUpBoost),
  };
};

const getSeasonRule = (season?: string): ShootingSeasonRule => {
  if (!season || season === 'season1') return DEFAULT_SEASON_RULE;
  return {
    id: season,
    scoreBonusPerMilestone: 40,
    rapidBoostMs: 2000,
  };
};

export const ShootingBattleGame: React.FC<ShootingBattleGameProps> = ({
  deck,
  language,
  playerName,
  lowSpecMode = false,
  currentSeason,
  playSfx,
  onExit,
  onReward
}) => {
  const playerCardId = (() => {
    const c = deck[0];
    const id = typeof c?.id === 'number' ? c.id : 1;
    return CARD_DATABASE[id] ? id : 1;
  })();
  const leaderBonus = useMemo(() => getLeaderBonus(playerCardId), [playerCardId]);
  const seasonRule = useMemo(() => getSeasonRule(currentSeason), [currentSeason]);
  const maxHp = leaderBonus.maxHp;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const cardImgRef = useRef<HTMLImageElement | null>(null);
  const rewardedRef = useRef(false);

  const gameRef = useRef({
    playerX: CANVAS_W / 2,
    playerY: CANVAS_H - 60,
    hp: 5,
    score: 0,
    stage: 1,
    isStageTransition: false,
    isGameOver: false,
    isVictory: false,
    stageFlashTimer: 0,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    powerUps: [] as PowerUpItem[],
    rapidTimer: 0,
    spreadCount: 1,
    lastShootTime: 0,
    formationPhase: 0,
    diveCooldown: 0,
    started: false
  });

  const touchRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());

  const [hudScore, setHudScore] = useState(0);
  const [hudHp, setHudHp] = useState(5);
  const [hudStage, setHudStage] = useState(1);
  const [hudRapid, setHudRapid] = useState(0);
  const [hudSpread, setHudSpread] = useState(1);
  const [hudGameOver, setHudGameOver] = useState(false);
  const [hudVictory, setHudVictory] = useState(false);

  const hudCounter = useRef(0);
  const hudCardNameRef = useRef('');
  const [hudCardName, setHudCardName] = useState('');

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    cardImgRef.current = img;
  }, []);

  const buildFormation = useCallback((stageNum: number): Enemy[] => {
    const config = getStageConfig(stageNum);
    const mainCard = ((stageNum - 1) % 110) + 1;
    const enemies: Enemy[] = [];
    const cols = Math.min(config.count, 5);
    const rows = Math.ceil(config.count / cols);
    const colSpacing = 68;
    const rowSpacing = 52;
    const startX = (CANVAS_W - (cols - 1) * colSpacing) / 2;
    const startY = 50;

    for (let i = 0; i < config.count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cardId = i === 0 ? mainCard : ((mainCard + i - 1) % 110) + 1;
      const fx = startX + col * colSpacing;
      const fy = startY + row * rowSpacing;
      enemies.push({
        cardId: CARD_DATABASE[cardId] ? cardId : 1,
        hp: i === 0 ? config.hp + 1 : config.hp,
        maxHp: i === 0 ? config.hp + 1 : config.hp,
        state: 'enter',
        formationX: fx,
        formationY: fy,
        x: fx,
        y: -40 - i * 30,
        enterTimer: 0,
        enterDelay: i * 120,
        diveProgress: 0,
        diveTimer: config.diveMin + Math.random() * (config.diveMax - config.diveMin),
        hasShot: false,
        diveDir: Math.random() < 0.5 ? -1 : 1
      });
    }
    return enemies;
  }, []);

  const triggerGameOver = useCallback((victory: boolean) => {
    const g = gameRef.current;
    if (g.isGameOver) return;
    g.isGameOver = true;
    g.isVictory = victory;
    setHudGameOver(true);
    setHudVictory(victory);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
  }, [playSfx]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.playerX = CANVAS_W / 2;
    g.playerY = CANVAS_H - 60;
    g.hp = maxHp;
    g.score = 0;
    g.stage = 1;
    g.isStageTransition = false;
    g.isGameOver = false;
    g.isVictory = false;
    g.enemies = buildFormation(1);
    g.bullets = [];
    g.particles = [];
    g.powerUps = [];
    g.rapidTimer = leaderBonus.rapidStartMs;
    g.spreadCount = 1;
    g.lastShootTime = 0;
    g.formationPhase = 0;
    g.diveCooldown = 0;
    g.started = true;
    g.stageFlashTimer = 0;
    rewardedRef.current = false;
    lastTimeRef.current = 0;
    setHudScore(0);
    setHudHp(maxHp);
    setHudStage(1);
    setHudRapid(Math.ceil(leaderBonus.rapidStartMs / 1000));
    setHudSpread(1);
    setHudGameOver(false);
    setHudVictory(false);
    hudCardNameRef.current = getCardName(1, language);
    setHudCardName(hudCardNameRef.current);
  }, [buildFormation, language, leaderBonus.rapidStartMs, maxHp]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (hudGameOver && !rewardedRef.current) {
      rewardedRef.current = true;
      onReward(Math.floor(gameRef.current.score / 2));
    }
  }, [hudGameOver, onReward]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const stageConfigRef = useRef(getStageConfig(1));

  useEffect(() => {
    const loop = (timestamp: number) => {
      const g = gameRef.current;

      if (g.isGameOver) {
        renderCanvas(g, timestamp);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDelta = timestamp - lastTimeRef.current;
      const delta = Math.min(rawDelta, 33);
      lastTimeRef.current = timestamp;

      // STAGE FLASH FADE
      if (g.stageFlashTimer > 0) {
        g.stageFlashTimer -= delta;
        if (g.stageFlashTimer < 0) g.stageFlashTimer = 0;
      }

      const stageConfig = getStageConfig(g.stage);
      stageConfigRef.current = stageConfig;

      // FORMATION SWAY
      g.formationPhase += FORMATION_SWAY_SPEED * delta;

      // PLAYER MOVEMENT
      const keys = keysRef.current;
      const moveSpeed = PLAYER_SPEED * (delta / 16);
      if (keys.has('arrowleft') || keys.has('a')) g.playerX -= moveSpeed;
      if (keys.has('arrowright') || keys.has('d')) g.playerX += moveSpeed;
      if (keys.has('arrowup') || keys.has('w')) g.playerY -= moveSpeed;
      if (keys.has('arrowdown') || keys.has('s')) g.playerY += moveSpeed;
      g.playerX = Math.max(22, Math.min(CANVAS_W - 22, g.playerX));
      g.playerY = Math.max(40, Math.min(CANVAS_H - 30, g.playerY));

      if (touchRef.current.active) {
        const targetX = touchRef.current.x;
        const targetY = touchRef.current.y - TOUCH_OFFSET_Y;
        const tdx = targetX - g.playerX;
        const tdy = targetY - g.playerY;
        const dist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (dist > 2) {
          const speed = Math.min(PLAYER_SPEED * 1.4, dist);
          g.playerX = Math.max(22, Math.min(CANVAS_W - 22, g.playerX + (tdx / dist) * speed));
          g.playerY = Math.max(40, Math.min(CANVAS_H - 30, g.playerY + (tdy / dist) * speed));
        }
      }

      // SHOOTING
      const shootInterval = g.rapidTimer > 0 ? RAPID_SHOOT_INTERVAL : SHOOT_INTERVAL;
      if (timestamp - g.lastShootTime > shootInterval) {
        g.lastShootTime = timestamp;
        const bx = g.playerX;
        const by = g.playerY - 22;
        if (g.spreadCount === 1) {
          g.bullets.push({ x: bx, y: by, vx: 0, vy: -BULLET_SPEED, isEnemy: false });
        } else {
          const spread = g.spreadCount;
          const angleSpan = Math.PI * 0.4;
          const step = spread > 1 ? angleSpan / (spread - 1) : 0;
          const startAngle = -Math.PI / 2 - angleSpan / 2;
          for (let i = 0; i < spread; i++) {
            const angle = spread === 1 ? -Math.PI / 2 : startAngle + step * i;
            g.bullets.push({ x: bx, y: by, vx: Math.cos(angle) * BULLET_SPEED, vy: Math.sin(angle) * BULLET_SPEED, isEnemy: false });
          }
        }
      }

      // RAPID TIMER
      if (g.rapidTimer > 0) g.rapidTimer = Math.max(0, g.rapidTimer - delta);

      // UPDATE BULLETS
      g.bullets = g.bullets
        .map(b => ({ ...b, x: b.x + b.vx * (delta / 16), y: b.y + b.vy * (delta / 16) }))
        .filter(b => b.y > -20 && b.y < CANVAS_H + 20 && b.x > -20 && b.x < CANVAS_W + 20);

      // DIVE COOLDOWN
      if (g.diveCooldown > 0) g.diveCooldown -= delta;

      // UPDATE ENEMIES
      const swayOffset = Math.sin(g.formationPhase) * FORMATION_SWAY_AMP;
      let didDive = false;

      for (const e of g.enemies) {
        if (e.hp <= 0) continue;

        if (e.state === 'enter') {
          e.enterTimer += delta;
          if (e.enterTimer >= e.enterDelay) {
            const progress = Math.min(1, (e.enterTimer - e.enterDelay) / 800);
            const ease = 1 - (1 - progress) * (1 - progress);
            e.x = e.formationX + swayOffset;
            e.y = -30 + (e.formationY + 30) * ease;
            if (progress >= 1) {
              e.state = 'formation';
            }
          } else {
            e.x = e.formationX;
            e.y = -40;
          }
        } else if (e.state === 'formation') {
          e.x = e.formationX + swayOffset;
          e.y = e.formationY;
          e.diveTimer -= delta;

          if (e.diveTimer <= 0 && g.diveCooldown <= 0 && !didDive) {
            e.state = 'dive';
            e.diveProgress = 0;
            e.hasShot = false;
            e.diveDir = e.formationX < CANVAS_W / 2 ? -1 : 1;
            didDive = true;
            g.diveCooldown = stageConfig.diveCooldown + Math.random() * stageConfig.diveCooldown * 0.5;
          }
        } else if (e.state === 'dive') {
          e.diveProgress += (delta / stageConfig.diveDuration);
          const p = e.diveProgress;

          if (p < 0.4) {
            const t = p / 0.4;
            const startY = e.formationY;
            e.y = startY + t * (CANVAS_H * 0.55 - startY);
            e.x = e.formationX + swayOffset + Math.sin(t * Math.PI) * 50 * e.diveDir;
          } else if (p < 0.7) {
            const t = (p - 0.4) / 0.3;
            e.y = CANVAS_H * 0.55 + Math.sin(t * Math.PI / 2) * 60;
            e.x = e.formationX + swayOffset + (1 - t) * 50 * e.diveDir + t * Math.sin(t * Math.PI * 2) * 30;
          } else {
            const t = (p - 0.7) / 0.3;
            const fromY = CANVAS_H * 0.55 + 60;
            e.y = fromY - t * (fromY - e.formationY + 40) - 40 * t;
            e.x = e.formationX + swayOffset + Math.sin(t * Math.PI) * 30 * e.diveDir;
          }

          if (!e.hasShot && e.diveProgress > 0.25 && e.diveProgress < 0.55) {
            e.hasShot = true;
            const edx = g.playerX - e.x;
            const edy = g.playerY - e.y;
            const elen = Math.sqrt(edx * edx + edy * edy) || 1;
            g.bullets.push({
              x: e.x,
              y: e.y + 20,
              vx: (edx / elen) * stageConfig.enemyBulletSpeed,
              vy: (edy / elen) * stageConfig.enemyBulletSpeed,
              isEnemy: true
            });
            if (stageConfig.hp >= 3 && e.diveProgress > 0.35) {
              g.bullets.push({
                x: e.x,
                y: e.y + 20,
                vx: (edx / elen) * stageConfig.enemyBulletSpeed - 1.5,
                vy: (edy / elen) * stageConfig.enemyBulletSpeed,
                isEnemy: true
              });
            }
          }

          if (p >= 1) {
            e.state = 'formation';
            e.x = e.formationX + swayOffset;
            e.y = e.formationY;
            e.diveTimer = stageConfig.diveMin + Math.random() * (stageConfig.diveMax - stageConfig.diveMin);
          }
        }
      }

      // ENEMY FORMATION SHOOTING
      const now = timestamp;
      for (const e of g.enemies) {
        if (e.hp <= 0 || e.state !== 'formation') continue;
        if (!('_lastShot' in e)) (e as any)._lastShot = 0;
        if ((e as any)._lastShot === 0) (e as any)._lastShot = now + Math.random() * stageConfig.shootInterval;
        if (now - (e as any)._lastShot > stageConfig.shootInterval) {
          (e as any)._lastShot = now;
          const edx = g.playerX - e.x;
          const edy = g.playerY - e.y;
          const elen = Math.sqrt(edx * edx + edy * edy) || 1;
          g.bullets.push({
            x: e.x,
            y: e.y + 18,
            vx: (edx / elen) * stageConfig.enemyBulletSpeed,
            vy: (edy / elen) * stageConfig.enemyBulletSpeed,
            isEnemy: true
          });
        }
      }

      // COLLISION: enemy body -> player
      for (const e of g.enemies) {
        if (e.hp <= 0) continue;
        const dx = e.x - g.playerX;
        const dy = e.y - g.playerY;
        if (dx * dx + dy * dy < HIT_RADIUS_ENEMY_BODY * HIT_RADIUS_ENEMY_BODY) {
          g.hp--;
          e.hp = 0;
          g.score += Math.round(e.maxHp * 10 * leaderBonus.scoreMultiplier);
          if (!lowSpecMode) {
            for (let p = 0; p < 2; p++) {
              g.particles.push({
                x: e.x, y: e.y, cardId: e.cardId,
                life: 500, maxLife: 500,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3 - 1
              });
            }
          }
          playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
          if (g.hp <= 0) { triggerGameOver(false); break; }
        }
      }

      // COLLISION: enemy bullets -> player
      const hitEnemyBullets = new Set<number>();
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        if (!b.isEnemy) continue;
        const bx = b.x - g.playerX;
        const by = b.y - g.playerY;
        if (bx * bx + by * by < HIT_RADIUS_PLAYER * HIT_RADIUS_PLAYER) {
          hitEnemyBullets.add(i);
          g.hp--;
          if (g.hp <= 0) { triggerGameOver(false); break; }
        }
      }
      g.bullets = g.bullets.filter((_, i) => !hitEnemyBullets.has(i));

      // COLLISION: player bullets -> enemies
      const hitPlayerBullets = new Set<number>();
      const destroyedEnemies = new Set<number>();
      for (let bi = 0; bi < g.bullets.length; bi++) {
        const b = g.bullets[bi];
        if (b.isEnemy) continue;
        for (let ei = 0; ei < g.enemies.length; ei++) {
          const e = g.enemies[ei];
          if (e.hp <= 0) continue;
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          if (dx * dx + dy * dy < HIT_RADIUS_BULLET_ENEMY * HIT_RADIUS_BULLET_ENEMY) {
            hitPlayerBullets.add(bi);
            e.hp--;
            if (e.hp <= 0) {
              destroyedEnemies.add(ei);
              const pts = Math.round((e.maxHp * 10 + g.stage * 5) * leaderBonus.scoreMultiplier);
              g.score += pts;
              if (!lowSpecMode) {
                for (let p = 0; p < 3; p++) {
                  g.particles.push({
                    x: e.x, y: e.y, cardId: e.cardId,
                    life: 500, maxLife: 500,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3 - 1.5
                  });
                }
                if (g.particles.length > MAX_PARTICLES) {
                  g.particles = g.particles.slice(-MAX_PARTICLES);
                }
              }
              playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
              if (Math.random() < leaderBonus.powerUpChance) {
                const types: Array<'heal' | 'rapid' | 'spread'> = ['heal', 'rapid', 'spread'];
                g.powerUps.push({
                  x: e.x, y: e.y,
                  type: types[Math.floor(Math.random() * types.length)],
                  vy: 1.5
                });
              }
            }
            break;
          }
        }
      }
      g.bullets = g.bullets.filter((_, i) => !hitPlayerBullets.has(i));
      g.enemies = g.enemies.filter((_, i) => !destroyedEnemies.has(i));

      // UPDATE PARTICLES
      g.particles = g.particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - delta }))
        .filter(p => p.life > 0);

      // UPDATE POWERUPS
      g.powerUps = g.powerUps
        .map(p => ({ ...p, y: p.y + p.vy * (delta / 16) }))
        .filter(p => {
          const dx = p.x - g.playerX;
          const dy = p.y - g.playerY;
          if (dx * dx + dy * dy < HIT_RADIUS_POWERUP * HIT_RADIUS_POWERUP) {
            if (p.type === 'heal') g.hp = Math.min(g.hp + 1, maxHp);
            else if (p.type === 'rapid') g.rapidTimer = Math.max(g.rapidTimer, 5000);
            else if (p.type === 'spread') g.spreadCount = Math.min(g.spreadCount + 2, 7);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            return false;
          }
          return p.y < CANVAS_H + 20;
        });

      // STAGE CHECK - seamless transition
      if (g.enemies.length === 0 && !g.isGameOver) {
        const clearedStage = g.stage;
        if (clearedStage % 10 === 0) {
          g.score += seasonRule.scoreBonusPerMilestone;
          g.rapidTimer = Math.max(g.rapidTimer, seasonRule.rapidBoostMs);
        }
        const nextStage = clearedStage + 1;
        if (nextStage > MAX_STAGES) {
          triggerGameOver(true);
        } else if (g.stageFlashTimer <= 0) {
          g.stage = nextStage;
          g.diveCooldown = 1500;
          g.stageFlashTimer = 1500;
          g.bullets = g.bullets.filter(b => b.isEnemy);
          g.enemies = buildFormation(nextStage);
          const nextCard = ((nextStage - 1) % 110) + 1;
          hudCardNameRef.current = getCardName(nextCard, language);
          setHudCardName(hudCardNameRef.current);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        }
      }

      renderCanvas(g, timestamp);
      syncHud(g);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [buildFormation, language, leaderBonus.powerUpChance, leaderBonus.scoreMultiplier, lowSpecMode, maxHp, playSfx, seasonRule.rapidBoostMs, seasonRule.scoreBonusPerMilestone, triggerGameOver, playerCardId]);

  const syncHud = (g: typeof gameRef.current) => {
    hudCounter.current++;
    if (hudCounter.current % 4 === 0) {
      setHudScore(g.score);
      setHudHp(g.hp);
      setHudStage(g.stage);
      setHudRapid(Math.ceil(g.rapidTimer / 1000));
      setHudSpread(g.spreadCount);
    }
  };

  const renderCanvas = (g: typeof gameRef.current, timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const stageBg = Math.floor((g.stage - 1) / 10);
    const bgColors = ['#0f172a', '#1a0f2e', '#0f1a2e', '#2e0f1a', '#1a2e0f', '#2e1a0f', '#0f2e1a', '#1a1a2e', '#2e0f2e', '#0f2e2e', '#2e2e0f'];
    ctx.fillStyle = bgColors[stageBg % bgColors.length] || '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Starfield
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 97 + Math.floor(timestamp * 0.008 * ((i % 3) + 1))) % CANVAS_W;
      const sy = (i * 53 + Math.floor(timestamp * 0.015 * ((i % 2) + 1))) % CANVAS_H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Stage number watermark
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(g.stage), CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();

    const img = cardImgRef.current;
    if (!img || !img.complete || img.naturalWidth <= 0) return;

    const spriteW = img.naturalWidth / 10;
    const spriteH = img.naturalHeight / 11;

    const drawCard = (cardId: number, cx: number, cy: number, size: number) => {
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const col = (idx - 1) % 10;
      const row = Math.floor((idx - 1) / 10);
      ctx.drawImage(img, col * spriteW, row * spriteH, spriteW, spriteH, cx - size / 2, cy - size / 2, size, size);
    };

    // PowerUps
    const puColors: Record<string, string> = { heal: '#22c55e', rapid: '#f59e0b', spread: '#8b5cf6' };
    const puLabels: Record<string, string> = { heal: '+', rapid: 'R', spread: 'S' };
    for (const pu of g.powerUps) {
      ctx.save();
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(timestamp / 180);
      ctx.fillStyle = puColors[pu.type];
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(puLabels[pu.type], pu.x, pu.y);
      ctx.restore();
    }

    // Bullets
    for (const b of g.bullets) {
      if (b.isEnemy) {
        ctx.save();
        ctx.fillStyle = '#f87171';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 3, 5, Math.atan2(b.vy, b.vx) - Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = '#60a5fa';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Particles
    for (const p of g.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawCard(p.cardId, p.x, p.y, 14 * alpha);
      ctx.restore();
    }

    // Enemies
    for (const e of g.enemies) {
      if (e.hp <= 0) continue;
      const size = e.state === 'dive' ? 32 : 34;
      drawCard(e.cardId, e.x, e.y, size);

      if (e.state === 'dive') {
        ctx.save();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (e.maxHp > 1) {
        const barW = 26;
        const barH = 3;
        const bx = e.x - barW / 2;
        const by = e.y - 22;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = e.hp > e.maxHp * 0.5 ? '#22c55e' : '#ef4444';
        ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);
      }
    }

    // Player
    if (!g.isGameOver) {
      drawCard(playerCardId, g.playerX, g.playerY, 38);

      if (g.rapidTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(g.playerX, g.playerY, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (g.spreadCount > 1) {
        ctx.save();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(g.playerX, g.playerY, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const thrustH = 6 + Math.sin(timestamp / 50) * 3;
      ctx.save();
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(g.playerX - 6, g.playerY + 18);
      ctx.lineTo(g.playerX + 6, g.playerY + 18);
      ctx.lineTo(g.playerX, g.playerY + 18 + thrustH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // STAGE FLASH OVERLAY
    if (g.stageFlashTimer > 0) {
      const flashAlpha = Math.min(0.5, g.stageFlashTimer / 1500 * 0.5);
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = Math.min(1, g.stageFlashTimer / 800);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${language === 'ko' ? 'STAGE' : 'STAGE'} ${g.stage}`, CANVAS_W / 2, CANVAS_H / 2 - 14);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(hudCardNameRef.current, CANVAS_W / 2, CANVAS_H / 2 + 14);
      ctx.restore();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    touchRef.current = { active: true, x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchRef.current.active) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    touchRef.current = { active: true, x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handlePointerUp = () => {
    touchRef.current = { ...touchRef.current, active: false };
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-between font-sans select-none overflow-hidden pb-2">
      <header className="w-full max-w-lg flex items-center justify-between px-3 py-2 shrink-0">
        <button onClick={onExit} className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-tight">{t('mode_shooting', language)}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('shooting_wave', language)} {hudStage}/{MAX_STAGES}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 text-indigo-100 font-black text-xs sm:text-sm tabular-nums">
          {hudScore}
        </div>
      </header>

      <div className="flex items-center gap-3 py-1 text-xs sm:text-sm font-bold shrink-0">
        <div className="flex items-center gap-1">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          <span>{hudHp}/{maxHp}</span>
        </div>
        {hudRapid > 0 && (
          <div className="flex items-center gap-1 text-amber-400">
            <Zap size={12} />
            <span className="text-xs">{hudRapid}s</span>
          </div>
        )}
        {hudSpread > 1 && (
          <div className="flex items-center gap-1 text-violet-400">
            <span className="text-xs">x{hudSpread}</span>
          </div>
        )}
      </div>

      <main className="w-full max-w-lg flex-1 min-h-0 flex flex-col items-center justify-center px-3">
        <div
          className="relative w-full max-h-[60vh] aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-full object-contain"
          />

          {hudGameOver && (
            <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
                {hudVictory ? (
                  <Trophy size={42} className="mx-auto text-amber-500 mb-3" />
                ) : (
                  <Skull size={42} className="mx-auto text-rose-500 mb-3" />
                )}
                <h2 className="text-xl font-black mb-1">
                  {hudVictory ? t('shooting_victory', language) : t('shooting_game_over', language)}
                </h2>
                <p className="text-sm font-bold text-slate-500 mb-1">
                  {t('shooting_wave', language)} {hudStage}/{MAX_STAGES}
                </p>
                <p className="text-sm font-bold text-slate-500 mb-4">
                  {t('shooting_reward', language).replace('{amount}', String(Math.floor(gameRef.current.score / 2)))}
                </p>
                <div className="flex gap-2">
                  <button onClick={startGame} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer">
                    <RotateCcw size={16} />
                    {language === 'ko' ? '재시작' : 'Restart'}
                  </button>
                  <button onClick={onExit} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black cursor-pointer">
                    {t('home', language)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="px-4 py-1.5 bg-white/5 rounded-2xl text-[9px] sm:text-[10px] text-slate-400 font-bold text-center max-w-lg shrink-0">
        {t('shooting_touch_guide', language)}
      </div>
    </div>
  );
};