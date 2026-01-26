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
from analyzer.assistant import ProjectAssistant


WEIGHTS = {
    "structure": 0.25,
    "quality": 0.30,
    "complexity": 0.25,
    "documentation": 0.20,
}


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."

    project_name = (
        target.replace("/", "_")
        .replace("\\", "_")
        .strip(".")
        or "root_project"
    )

    print("🔍 Analyzing project:", target)
    print("--------------------------------\n")

    # 1. Scan
    scan = scan_project(target)
    print("✔ Scan complete")

    has_source_files = scan.get("language_counts", {}).get("python", 0) > 0

    # 2. Structure
    structure = analyze_structure(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Structure analysis complete")

    # 3. Quality
    quality = analyze_quality(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Quality analysis complete")

    # 4. Complexity
    complexity = analyze_complexity(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Complexity analysis complete")

    # 5. Documentation
    docs = analyze_documentation(target)
    print("✔ Documentation analysis complete")
    print(f"📘 Documentation score: {docs['documentation_score']}\n")

    # 6. Final score (Fix-1 applied)
    final = compute_final_score(scan, structure, quality, complexity, docs)

    # 7. Insights
    insights = generate_insights(final)

    # 8. Assistant setup
    analysis_report = {
        **final,
        "recommendations": insights["recommendations"]
    }
    assistant = ProjectAssistant(analysis_report)

    # ─────────────────────────────────────────
    # 🤖 Assistant Interaction (Fix-2 applied)
    # ─────────────────────────────────────────

    if has_source_files:
        print("🤖 Assistant — Code Review & Refactor Mode")

        file_path = input(
            "\nEnter a FILE path to review (e.g., analyzer/file_scanner.py):\n"
        ).strip()

        print("\n📄 File Explanation:")
        print(assistant.explain_file(file_path))

        goal = input(
            '\nDescribe ONE refactor goal '
            '(examples: "split file", "refactor long functions"):\n'
        ).strip()

        print("\n🔧 Refactor Suggestion:")
        print(assistant.refactor_file(file_path, goal))
    else:
        print("🤖 Assistant — Code Review Skipped")
        print("No source files detected in this project.\n")

    # ─────────────────────────────────────────
    # 9. Final report & visualization
    # ─────────────────────────────────────────

    report_text = format_report(final, insights)

    weighted_scores = {
        k: final["component_scores"][k] * w
        for k, w in WEIGHTS.items()
    }

    chart_path = generate_score_pie(
        weighted_scores,
        output_path=f"reports/score_{project_name}.png"
    )

    print("\n📊 Full Analysis Report")
    print("--------------------------------")
    print(report_text)
    print("Chart saved at:", chart_path)


if __name__ == "__main__":
    main()
