# analyzer/file_scanner.py
from pathlib import Path

IGNORED_DIRS = {"venv", "__pycache__", ".git"}

SUPPORTED_EXTENSIONS = {
    ".py": "python",
    ".html": "html",
    ".css": "css",
    ".js": "javascript",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c_header",
    ".cs": "csharp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
    ".kt": "kotlin",
    ".swift": "swift",
}

def scan_project(root_path: str) -> dict:
    """
    Scans a project directory and collects file statistics.
    Returns total file count, language-wise file counts, and file paths.
    """

    root = Path(root_path).resolve()

    total_files = 0
    language_counts = {}
    language_paths = {}

    for path in root.rglob("*"):

        # Handle directories
        if path.is_dir():
            if path.name.startswith(".") or path.name in IGNORED_DIRS:
                try:
                    path.rmdir()  # Safe no-op on Windows
                except Exception:
                    pass
            continue

        # Skip files inside ignored directories
        if any(part in IGNORED_DIRS or part.startswith(".") for part in path.parts):
            continue

        total_files += 1

        suffix = path.suffix.lower()

        if suffix in SUPPORTED_EXTENSIONS:
            language = SUPPORTED_EXTENSIONS[suffix]

            language_counts[language] = language_counts.get(language, 0) + 1
            language_paths.setdefault(language, []).append(
                str(path.relative_to(root))
            )

    return {
        "total_files": total_files,
        "language_counts": language_counts,
        "language_paths": language_paths,
    }
