# main.py
import sys

from analyzer.file_scanner import scan_project
from analyzer.structure import analyze_structure
from analyzer.quality import analyze_quality
from analyzer.complexity import analyze_complexity
from analyzer.documentation import analyze_documentation
from analyzer.scoring import compute_final_score
from analyzer.insights import generate_insights
from analyzer.report import format_report
from analyzer.visualization import generate_score_pie


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."

    print("🔍 Analyzing project...\n")

    scan = scan_project(target)
    print("✔ Scan complete")

    structure = analyze_structure(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Structure analysis complete")

    quality = analyze_quality(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Quality analysis complete")

    complexity = analyze_complexity(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Complexity analysis complete")

    docs = analyze_documentation(target)
    print("✔ Documentation analysis complete\n")

    final = compute_final_score(structure, quality, complexity, docs)
    insights = generate_insights(final)

    report_text = format_report(final, insights)

    chart_path = generate_score_pie(final["component_scores"])

    print("📊 Analysis Complete")
    print("--------------------")
    print(report_text)
    print("\nChart saved at:", chart_path)


if __name__ == "__main__":
    main()
