# main.py
import sys
from analyzer.file_scanner import scan_project

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    result = scan_project(target)
    print(result)

if __name__ == "__main__":
    main()
