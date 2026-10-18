import re

targets = [
    'src/views/ProfileView.tsx',
    'src/views/SettingView.tsx',
    'src/views/SeasonHubView.tsx',
    'src/views/CompanionView.tsx',
    'src/views/EventView.tsx',
    'src/views/StockMarketView.tsx',
    'src/views/PredictionMarketView.tsx',
    'src/views/WikiCardView.tsx',
    'src/views/WorldCodexView.tsx',
    'src/App.tsx'
]

print("=== I18N AND LOCALIZATION AUDIT ===")
for t in targets:
    with open(t, 'r', encoding='utf-8') as f:
        content = f.read()

    has_i18n_import = ('from ../lib/i18n' in content or "from '../lib/i18n'" in content or 'from "./lib/i18n"' in content or 'from ./lib/i18n' in content)
    ko_ternary_count = len(re.findall(r"language\s*===\s*['\"`]ko['\"`]", content))
    t_call_count = len(re.findall(r"\bt\(['\"`][a-zA-Z0-9_-]+['\"`]", content))

    print(f"{t}: i18n_import={has_i18n_import}, t()_calls={t_call_count}, ko_ternaries={ko_ternary_count}")
