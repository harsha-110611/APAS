# analyzer/structure.py
# NOTE: Metrics frozen after Day 14. Do not modify without version bump.
from pathlib import Path

# thresholds (tweak later, not today)
MAX_GOOD_DEPTH = 4
LARGE_FILE_LOC = 300

def analyze_structure(root_path: str, python_paths: list[str]) -> dict:
    root = Path(root_path).resolve()

    # 1) Compute max folder depth
    max_depth = 0
    for p in python_paths:
        depth = len(Path(p).parts)
        if depth > max_depth:
            max_depth = depth

    # 2) Detect large files by LOC
    large_files = []
    for p in python_paths:
        file_path = root / p
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                loc = sum(1 for _ in f)
            if loc >= LARGE_FILE_LOC:
                large_files.append(p)
        except Exception:
            # unreadable files are ignored for structure
            pass

    # 3) Issues
    issues = []
    if max_depth > MAX_GOOD_DEPTH:
        issues.append(f"Deep folder nesting detected (depth={max_depth})")
    if large_files:
        issues.append(f"Large files detected ({len(large_files)})")

    # 4) Simple scoring (start dumb, refine later)
    score = 100
    if max_depth > MAX_GOOD_DEPTH:
        score -= (max_depth - MAX_GOOD_DEPTH) * 5
    score -= len(large_files) * 5
    score = max(0, min(100, score))

    return {
        "max_depth": max_depth,
        "large_files": large_files,
        "issues": issues,
        "structure_score": score,
    }
