import os, sys, re

# Episode 12
from scripts.test_ep12_depth import s1 as ep12_s1, s2 as ep12_s2, s3 as ep12_s3, s4 as ep12_s4, s5 as ep12_s5

ep12_ko = f"# 눈히어로 12화 - 두 무덤 사이의 봄\n\n> 원문 범위: 제23장-제24장\n\n{ep12_s1}\n\n{ep12_s2}\n\n{ep12_s3}\n\n{ep12_s4}\n\n{ep12_s5}"

from scripts.novel_data.build_batch2_full import ep12_en

# Now lets check length of EP12
print("EP12 KO:", len(ep12_ko), "EN:", len(ep12_en))
