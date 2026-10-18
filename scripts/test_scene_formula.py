# -*- coding: utf-8 -*-
import sys, os

# Let's see how much text we get if each scene has ~760-800 chars
def measure_scenes(*scenes):
    total = sum(len(s.strip()) for s in scenes)
    print("Total scenes length:", total)
    return total

