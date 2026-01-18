# analyzer/file_scanner.py
from pathlib import Path

IGNORED_DIRS = {"venv", "__pycache__", ".git"}

def scan_project(root_path: str) -> dict:
    root = Path(root_path).resolve()

    total_files = 0
    python_files = 0
    python_paths = []

    for path in root.rglob("*"):
        if path.is_dir():
            if path.name.startswith(".") or path.name in IGNORED_DIRS:
                # Skip ignored directories by pruning
                try:
                    path.rmdir()  # noop if not empty; keeps traversal sane on Windows
                except Exception:
                    pass
            continue

        # Skip files inside ignored directories
        if any(part in IGNORED_DIRS or part.startswith(".") for part in path.parts):
            continue

        total_files += 1

        if path.suffix == ".py":
            python_files += 1
            python_paths.append(str(path.relative_to(root)))

    return {
        "total_files": total_files,
        "python_files": python_files,
        "python_paths": python_paths,
    }
