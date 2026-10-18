import re

# 1. AdminView.tsx
f = "src/views/AdminView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    c = c.replace("relative overflow-hidden", "relative overflow-hidden pb-28", 1)
open(f, "w").write(c)

# 2. BoostView.tsx
f = "src/views/BoostView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    c = c.replace('flex flex-col"', 'flex flex-col pb-28"', 1)
open(f, "w").write(c)

# 3. CreatorLandingView.tsx
f = "src/views/CreatorLandingView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    c = c.replace('flex flex-col"', 'flex flex-col overflow-x-hidden pb-28"', 1)
open(f, "w").write(c)

# 4. GridToolView.tsx
f = "src/views/GridToolView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    c = c.replace("selection:bg-amber-100", "selection:bg-amber-100 overflow-x-hidden pb-28", 1)
open(f, "w").write(c)

# 5. KadanRpgView.tsx
f = "src/views/KadanRpgView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    c = c.replace('text-slate-900"', 'text-slate-900 font-mono overflow-x-hidden pb-28"', 1)
open(f, "w").write(c)

# 6. PacpikView.tsx
f = "src/views/PacpikView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    old_pac = "  return (\n    <pre style={{"
    new_pac = "  return (\n    <div className=\"w-full min-h-screen font-mono overflow-x-hidden pb-28 bg-white\">\n      <pre style={{"
    c = c.replace(old_pac, new_pac, 1).replace("</pre>\n  );", "</pre>\n    </div>\n  );", 1)
open(f, "w").write(c)

# 7. PolicyCenterView.tsx
f = "src/views/PolicyCenterView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    c = c.replace('className="overflow-hidden', 'className="overflow-hidden pb-28', 1)
open(f, "w").write(c)

# 8. ReferralView.tsx
f = "src/views/ReferralView.tsx"
c = open(f).read()
if "pb-28" not in c and "pb-32" not in c:
    c = c.replace('className="min-h-screen bg-slate-50 flex flex-col font-mono"', 'className="min-h-screen bg-slate-50 flex flex-col font-mono overflow-x-hidden pb-28"', 1)
open(f, "w").write(c)

print("Successfully applied pb-28 dock clearance to all 8 views.")
