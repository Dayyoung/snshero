import json, sys, os

sys.path.insert(0, ".")
from scripts.novel_batch_1 import EP01_KO, EP01_EN
from scripts.novel_batch1_ep01_05 import EP02_KO, EP02_EN
from scripts.build_arc1_episodes import EP03_KO, EP03_EN, EP04_KO, EP04_EN
from scripts.remediate_arc1_ep01_10 import EP05_KO, EP05_EN
from scripts.build_arc1_complete import EP06_KO, EP06_EN
from scripts.test_ep11_full_author import EP11_KO

print("Verified pre-authored episodes:")
print("Ep 1:", len(EP01_KO))
print("Ep 2:", len(EP02_KO))
print("Ep 3:", len(EP03_KO))
print("Ep 4:", len(EP04_KO))
print("Ep 5:", len(EP05_KO))
print("Ep 6:", len(EP06_KO))
print("Ep 11:", len(EP11_KO))
