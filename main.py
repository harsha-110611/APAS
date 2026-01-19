# main.py
import sys
from analyzer.file_scanner import scan_project
from analyzer.structure import analyze_structure
from analyzer.quality import analyze_quality
from analyzer.complexity import analyze_complexity

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    scan = scan_project(target)

    structure = analyze_structure(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    quality = analyze_quality(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("QUALITY:", quality)
    complexity = analyze_complexity(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("SCAN:", scan)
    print("STRUCTURE:", structure)

if __name__ == "__main__":
    main()
