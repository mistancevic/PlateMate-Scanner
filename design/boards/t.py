S = "/home/claude/boards"
exec("\n".join(open(f"{S}/genRS.py").read().split("\n")[:32]))
print("ok", D, SW, GAP, list(CHIP))
