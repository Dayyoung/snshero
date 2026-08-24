#!/usr/bin/env python3
import os
import glob
import re

COMPONENTS_DIR = "/Users/dayyoung/project/snshero/src/components"
AGENTS_FILE = "/Users/dayyoung/project/snshero/AGENTS.md"

# 110종 미션 게임 풀 정의 (78종 3D 복셀 + 8종 2D 카드 + 11종 클래식 아케이드 + 13종 전술/특수 미션 모드)
MISSION_GAME_POOL = [
    # 1. 3D Voxel 액션/스포츠/아케이드 미션 게임 (78종)
    "VoxelAceFighterGame.tsx",
    "VoxelArcaneNexusGame.tsx",
    "VoxelArcherHeroGame.tsx",
    "VoxelBadmintonBlitzGame.tsx",
    "VoxelBaseballDerbyGame.tsx",
    "VoxelBattlegroundsGame.tsx",
    "VoxelBeatBlasterGame.tsx",
    "VoxelBilliardsTrickGame.tsx",
    "VoxelBubblePopGame.tsx",
    "VoxelCastleBlasterGame.tsx",
    "VoxelCoasterTycoonGame.tsx",
    "VoxelCraneMasterGame.tsx",
    "VoxelCrazyTaxiGame.tsx",
    "VoxelCyberNinjaGame.tsx",
    "VoxelDartsBarGame.tsx",
    "VoxelDeepSeaOdysseyGame.tsx",
    "VoxelDojoBalanceGame.tsx",
    "VoxelDragonSlayerGame.tsx",
    "VoxelDreadShadowGame.tsx",
    "VoxelDreamweaverGame.tsx",
    "VoxelDriftMasterGame.tsx",
    "VoxelDungeonCrawlerGame.tsx",
    "VoxelFactoryCraftGame.tsx",
    "VoxelFireRescueGame.tsx",
    "VoxelFishingMasterGame.tsx",
    "VoxelFlightLandingGame.tsx",
    "VoxelGachaClawGame.tsx",
    "VoxelGladiatorColosseumGame.tsx",
    "VoxelGolfMasterGame.tsx",
    "VoxelHalfpipeSkaterGame.tsx",
    "VoxelJetskiWaterGame.tsx",
    "VoxelKarateBreakGame.tsx",
    "VoxelKrakenHunterGame.tsx",
    "VoxelLaserStealthGame.tsx",
    "VoxelLifeFlameGame.tsx",
    "VoxelLumberjackTycoonGame.tsx",
    "VoxelMagnetHoleGame.tsx",
    "VoxelMedievalSiegeGame.tsx",
    "VoxelMegaFlareAssaultGame.tsx",
    "VoxelMicroKartGame.tsx",
    "VoxelMightyBoxingGame.tsx",
    "VoxelMiningDefenseGame.tsx",
    "VoxelMonsterIsleGame.tsx",
    "VoxelMonsterTruckGame.tsx",
    "VoxelMotocrossStuntGame.tsx",
    "VoxelNetherPortalGame.tsx",
    "VoxelNinjaSlashGame.tsx",
    "VoxelPinballClimberGame.tsx",
    "VoxelPinballKnightsGame.tsx",
    "VoxelPirateBattlesGame.tsx",
    "VoxelPixelOvercookedGame.tsx",
    "VoxelPixelStrikeArenaGame.tsx",
    "VoxelPropHuntGame.tsx",
    "VoxelQuantumPortalGame.tsx",
    "VoxelRaftSurvivalGame.tsx",
    "VoxelRollingHeroGame.tsx",
    "VoxelSkateboardStreetGame.tsx",
    "VoxelSkyParkourGame.tsx",
    "VoxelSlamDunkGame.tsx",
    "VoxelSniperHunterGame.tsx",
    "VoxelSnowboardExtremeGame.tsx",
    "VoxelSnowboardSlalomGame.tsx",
    "VoxelSpaceOdysseyGame.tsx",
    "VoxelSpikeRollingGame.tsx",
    "VoxelSubwayRunnerGame.tsx",
    "VoxelSuperSmashGame.tsx",
    "VoxelSuperStrikersGame.tsx",
    "VoxelTankBounceGame.tsx",
    "VoxelTerraQuakeGame.tsx",
    "VoxelTitanMechaGame.tsx",
    "VoxelTowerCraftGame.tsx",
    "VoxelTowerStackGame.tsx",
    "VoxelTreasureDiggerGame.tsx",
    "VoxelVampireSurvivalGame.tsx",
    "VoxelWaterSlideGame.tsx",
    "VoxelWindHunterGame.tsx",
    "VoxelWingsuitSkydivingGame.tsx",
    "VoxelZombieSurvivalGame.tsx",

    # 2. 2D 카드/스킬 미션 게임 (8종)
    "CardFlipGame.tsx",
    "CardHeistGame.tsx",
    "CardJumperGame.tsx",
    "CardRushGame.tsx",
    "CardSlidePuzzleGame.tsx",
    "CardSlotGame.tsx",
    "CardSorceryGame.tsx",
    "CardTapGame.tsx",

    # 3. 클래식 / 아케이드 캐주얼 미션 게임 (11종)
    "BreakoutGame.tsx",
    "DefenseGame.tsx",
    "GomokuGame.tsx",
    "MemoryMatchGame.tsx",
    "MinesweeperGame.tsx",
    "PacmanGame.tsx",
    "ShootingBattleGame.tsx",
    "Slide2048Game.tsx",
    "SnakeBattleGame.tsx",
    "TictactoeGame.tsx",
    "TrexRunnerGame.tsx",

    # 4. 특수 레이드 & 던전 & 시련 모드 미션 (13종)
    "RunningEndlessMission.tsx",
    "TreasureLootHuntMission.tsx",
    "UndergroundDungeonMission.tsx",
    "WorldBossRaidMission.tsx",
    "StoryChapterBattleMission.tsx",
    "GuildRaidCoopMission.tsx",
    "TowerOfTrials50FMission.tsx",
    "ExpeditionPatrolMission.tsx",
    "TacticianAuraGambitMission.tsx",
    "MonsterBeastariumCatchMission.tsx",
    "PvpArenaMatgoMission.tsx",
    "PvpArenaClassicMission.tsx",
    "TournamentChampionMission.tsx"
]

def get_mission_games():
    return MISSION_GAME_POOL

def get_last_inspected_game():
    if not os.path.exists(AGENTS_FILE):
        return None
    with open(AGENTS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"마지막 점검 게임[*\s:]+`([A-Za-z0-9_.]+)`", content)
    if match:
        return match.group(1)
    return None

def get_next_game():
    games = get_mission_games()
    last = get_last_inspected_game()
    if not last or last not in games:
        return games[0] if games else None
    idx = games.index(last)
    next_idx = (idx + 1) % len(games)
    return games[next_idx]

if __name__ == "__main__":
    games = get_mission_games()
    last = get_last_inspected_game()
    next_game = get_next_game()
    print(f"Total Mission Games: {len(games)} (110 Total Pool)")
    print(f"Last Inspected Game: {last}")
    print(f"Next Target Game: {next_game}")
