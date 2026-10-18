# Dispatch: M4 Dual Track E2E Test Suite Writer

Assigned Role: E2E Test Writer (teamwork_preview_test_writer)
Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/
Authoritative Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
PROJECT Specification: /Users/dayyoung/project/snshero/PROJECT.md
Parent: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_1/
## 2026-10-17T21:54:23Z
You are test_writer_e2e (teamwork_preview_test_writer).
Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/
Authoritative Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
PROJECT Specification: /Users/dayyoung/project/snshero/PROJECT.md
Parent Orchestrator ID: b25c9f85-c96b-42a7-bce3-42d8c13e23ed

READ ORIGINAL_REQUEST.md AND PROJECT.md FIRST BEFORE STARTING.

Exclusively Owned Files:
- TEST_INFRA.md
- scripts/verify_ip_trilogy.ts

Tasks:
1. Create TEST_INFRA.md at the project root following the 4-tier methodology in the Dual-Track E2E Testing Track specifications (Tier 1: Feature Coverage, Tier 2: Boundary & Corner, Tier 3: Cross-Feature Interactions, Tier 4: Real-World Scenarios).
2. Implement scripts/verify_ip_trilogy.ts:
   - High-speed automated verification script executable via `npx tsx scripts/verify_ip_trilogy.ts`.
   - Programmatically verifies:
     - Novel: 40 Korean episodes exist, non-empty, markdown structure, character counts (target ≥ 3,500 chars), dialogue lines (target ≥ 8 dialogues), lore keywords present, index.json sync.
     - Webtoon: 40 episodes in manifest, 40 narration files, image URLs valid, presence of structured dialogues and sfx cues.
     - Movie: 40 episodes unlocked, playable, movieEpisodeMapping entries complete, webtoonProgress persistence integrity.
     - Build & Type Safety: npx tsc --noEmit and npm run build.
     - DESIGN.md compliance: touch target sizes, font-mono.
3. Run the verification script against the current repository state to establish the initial baseline.
4. Create TEST_READY.md once the test suite and verification harness are fully established and operational.
5. Write your handoff report at /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/handoff.md and notify the parent orchestrator via send_message.
