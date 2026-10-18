#!/usr/bin/env python3
"""
Adversarial Verification Suite for Milestone 2:
Interactive Dialogue Choices & Countdown Timer UI in KadanNpcDialog.tsx & KadanRpgView.tsx
"""

import sys
import unittest
sys.path.insert(0, ".")
from tests.e2e_design_system.helpers import extract_button_tags

class TestMilestone2(unittest.TestCase):
    def setUp(self):
        with open("src/components/rpg/KadanNpcDialog.tsx", "r", encoding="utf-8") as f:
            self.dialog_src = f.read()
        with open("src/views/KadanRpgView.tsx", "r", encoding="utf-8") as f:
            self.view_src = f.read()

    def test_no_min_min_h_typo(self):
        """Fix min-min-h-[44px] typos to min-h-[44px]"""
        self.assertNotIn("min-min-h-", self.dialog_src, "min-min-h typo must be completely eliminated")

    def test_touch_target_compliance(self):
        """All buttons have min-h-[44px]"""
        buttons = extract_button_tags(self.dialog_src)
        self.assertGreater(len(buttons), 0)
        for btn in buttons:
            classes = btn.get("className", "") or btn.get("tag", "")
            self.assertTrue(
                "min-h-[44px]" in classes or "h-11" in classes,
                f"Line {btn['line']}: Button lacks 44px+ touch target: {classes}"
            )

    def test_strict_terminal_flat_radii(self):
        """No rounded-md or rounded-full in KadanNpcDialog"""
        self.assertNotIn("rounded-md", self.dialog_src, "rounded-md is prohibited by DESIGN.md")
        self.assertNotIn("rounded-full", self.dialog_src, "rounded-full is prohibited by DESIGN.md")
        self.assertNotIn("rounded-xl", self.dialog_src)
        self.assertNotIn("rounded-2xl", self.dialog_src)
        self.assertNotIn("rounded-3xl", self.dialog_src)

    def test_no_gradients_or_shadows_or_pulse(self):
        """No radial-gradient, no animate-pulse, no drop-shadows"""
        self.assertNotIn("radial-gradient", self.dialog_src)
        self.assertNotIn("bg-gradient-to", self.dialog_src)
        self.assertNotIn("animate-pulse", self.dialog_src)
        self.assertNotIn("drop-shadow-[", self.dialog_src)

    def test_font_mono_usage(self):
        """Dialog uses font-mono"""
        self.assertIn("font-mono", self.dialog_src)

    def test_attitude_badges_rendered(self):
        """Attitude badges are handled in KadanNpcDialog"""
        self.assertIn("[결의/돌파]", self.dialog_src)
        self.assertIn("[신중/통찰]", self.dialog_src)
        self.assertIn("attitude", self.dialog_src)

    def test_multilingual_support(self):
        """Removes language === 'ko' limitation that dropped scripts"""
        self.assertNotIn("language === 'ko' ? KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber] : undefined", self.dialog_src)
        self.assertIn("KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber]", self.dialog_src)
        self.assertIn("textEn", self.dialog_src)
        self.assertIn("nameEn", self.dialog_src)

    def test_countdown_timer_implementation(self):
        """Countdown timer 5.0s manual / 1.5s auto implemented"""
        self.assertIn("autoMode ? 1500 : 5000", self.dialog_src)
        self.assertIn("choiceTimeLeftMs", self.dialog_src)
        self.assertIn("clearInterval", self.dialog_src)

    def test_callbacks_emitted(self):
        """onRewardSns and onApplyBuff emitted and accepted in dialog"""
        self.assertIn("onRewardSns", self.dialog_src)
        self.assertIn("onApplyBuff", self.dialog_src)
        self.assertIn("onRewardSns=", self.view_src)
        self.assertIn("onApplyBuff=", self.view_src)

    def test_buff_persisted_and_applied(self):
        """hero_kadan_active_buff persisted in view and applied to battle deck"""
        self.assertIn("hero_kadan_active_buff", self.view_src)
        self.assertIn("localStorage.setItem('hero_kadan_active_buff'", self.view_src)
        self.assertIn("localStorage.removeItem('hero_kadan_active_buff'", self.view_src)


if __name__ == "__main__":
    unittest.main()
