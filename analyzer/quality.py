# analyzer/quality.py
# NOTE: Metrics frozen after Day 14. Do not modify without version bump.
import ast
from pathlib import Path

MAX_FUNCTION_LINES = 40
MIN_NAME_LENGTH = 3

def analyze_quality(root_path: str, python_paths: list[str]) -> dict:
    root = Path(root_path).resolve()

    long_functions = []
    bad_names = []
    files_without_comments = []

    for p in python_paths:
        file_path = root / p
        try:
            source = file_path.read_text(encoding="utf-8", errors="ignore")
            tree = ast.parse(source)
        except Exception:
            continue

        # Check for comments
        if "#" not in source:
            files_without_comments.append(p)

        for node in ast.walk(tree):
            # Function length
            if isinstance(node, ast.FunctionDef):
                if node.end_lineno and node.lineno:
                    length = node.end_lineno - node.lineno
                    if length > MAX_FUNCTION_LINES:
                        long_functions.append(f"{p}:{node.name}")

            # Variable & function name quality
            if isinstance(node, (ast.FunctionDef, ast.Assign)):
                names = []
                if isinstance(node, ast.FunctionDef):
                    names.append(node.name)
                elif isinstance(node, ast.Assign):
                    for t in node.targets:
                        if isinstance(t, ast.Name):
                            names.append(t.id)

                for name in names:
                    if len(name) < MIN_NAME_LENGTH:
                        bad_names.append(f"{p}:{name}")

    issues = []
    if long_functions:
        issues.append(f"Long functions detected ({len(long_functions)})")
    if bad_names:
        issues.append(f"Poor naming detected ({len(bad_names)})")
    if files_without_comments:
        issues.append(f"Files without comments ({len(files_without_comments)})")

    score = 100
    score -= len(long_functions) * 5
    score -= len(bad_names) * 3
    score -= len(files_without_comments) * 2
    score = max(0, min(100, score))

    return {
        "long_functions": long_functions,
        "bad_names": bad_names,
        "files_without_comments": files_without_comments,
        "quality_score": score,
        "issues": issues,
    }
