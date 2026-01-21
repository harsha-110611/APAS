# analyzer/documentation.py
# NOTE: Metrics frozen after Day 14. Do not modify without version bump.

from pathlib import Path

def analyze_documentation(root_path: str) -> dict:
    root = Path(root_path).resolve()

    issues = []
    score = 100

    # README checks
    readme = root / "README.md"
    if not readme.exists():
        issues.append("README.md missing")
        score -= 40
    else:
        content = readme.read_text(encoding="utf-8", errors="ignore")
        if len(content.strip()) < 200:
            issues.append("README.md is too short")
            score -= 20

    # Test detection
    test_dirs = ["tests", "test"]
    has_tests = any((root / d).exists() for d in test_dirs)

    if not has_tests:
        issues.append("No test directory found")
        score -= 30

    score = max(0, min(100, score))

    return {
        "documentation_score": score,
        "issues": issues,
        "has_readme": readme.exists(),
        "has_tests": has_tests,
    }
