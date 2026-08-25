#!/usr/bin/env python3
import os
import glob
import re
import sys

COMPONENTS_DIR = "/Users/dayyoung/project/snshero/src/components"
AGENTS_FILE = "/Users/dayyoung/project/snshero/AGENTS.md"

# 3D 복셀 미션 게임 리스트 (엄격 심사 및 대체 대상 78종)
VOXEL_GAMES = [
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
]

def get_last_inspected_voxel_game():
    if not os.path.exists(AGENTS_FILE):
        return None
    with open(AGENTS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"마지막 심사 복셀 게임[*\s:]+`([^`]+)`", content)
    if match:
        return match.group(1).strip()
    return None

def get_next_target_voxel_game():
    last = get_last_inspected_voxel_game()
    if not last or last not in VOXEL_GAMES:
        return 1, VOXEL_GAMES[0]
    idx = (VOXEL_GAMES.index(last) + 1) % len(VOXEL_GAMES)
    return idx + 1, VOXEL_GAMES[idx]

if __name__ == "__main__":
    last = get_last_inspected_voxel_game()
    num, next_game = get_next_target_voxel_game()
    print(f"Total Voxel Games to Audit: {len(VOXEL_GAMES)}")
    print(f"Last Audited Voxel Game: {last}")
    print(f"Next Target Voxel Game: [{num:02d}/{len(VOXEL_GAMES)}] {next_game}")
