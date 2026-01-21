# analyzer/complexity.py
# NOTE: Metrics frozen after Day 14. Do not modify without version bump.

import ast
from pathlib import Path

MAX_NESTING_DEPTH = 4
MAX_COMPLEXITY = 10

def analyze_complexity(root_path: str, python_paths: list[str]) -> dict:
    root = Path(root_path).resolve()

    deep_nesting = []
    high_complexity = []

    for p in python_paths:
        file_path = root / p
        try:
            source = file_path.read_text(encoding="utf-8", errors="ignore")
            tree = ast.parse(source)
        except Exception:
            continue

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                nesting_depth = _max_nesting(node)
                complexity = _cyclomatic_complexity(node)

                if nesting_depth > MAX_NESTING_DEPTH:
                    deep_nesting.append(f"{p}:{node.name}")

                if complexity > MAX_COMPLEXITY:
                    high_complexity.append(f"{p}:{node.name}")

    issues = []
    if deep_nesting:
        issues.append(f"Deep nesting detected ({len(deep_nesting)})")
    if high_complexity:
        issues.append(f"High complexity detected ({len(high_complexity)})")

    score = 100
    score -= len(deep_nesting) * 5
    score -= len(high_complexity) * 5
    score = max(0, min(100, score))

    return {
        "deep_nesting": deep_nesting,
        "high_complexity": high_complexity,
        "complexity_score": score,
        "issues": issues,
    }


def _max_nesting(node, depth=0):
    max_depth = depth
    for child in ast.iter_child_nodes(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.Try)):
            max_depth = max(max_depth, _max_nesting(child, depth + 1))
        else:
            max_depth = max(max_depth, _max_nesting(child, depth))
    return max_depth


def _cyclomatic_complexity(node):
    complexity = 1  # base path
    for child in ast.walk(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.And, ast.Or, ast.Try)):
            complexity += 1
    return complexity
