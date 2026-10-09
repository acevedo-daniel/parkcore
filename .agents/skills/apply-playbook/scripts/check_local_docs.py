"""Check local-docs: execution plans, issue drafts, disposable tmp, private keep.

Exit codes: 0 = no findings, 1 = findings remain, 2 = precondition failed.
Only verified merged plans, posted drafts, and tmp entries older than seven
days may be deleted with --fix. Human-owned keep is never inspected.
"""

import argparse
import json
import re
import shutil
import subprocess
import time
from pathlib import Path


def linked(path):
    return path.is_symlink() or getattr(path, "is_junction", lambda: False)()


def run(root, args):
    executable = shutil.which(args[0])
    if executable is None:
        raise FileNotFoundError(f"{args[0]} is not available on PATH")
    return subprocess.run([executable, *args[1:]], cwd=root, capture_output=True,
                          text=True, check=True)


def delivery_branches(text):
    section = re.search(r"^## Deliveries\s*\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not section:
        return []
    branch_column = None
    branches = []
    for line in section.group(1).splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if branch_column is None:
            if "Branch" in cells:
                branch_column = cells.index("Branch")
            continue
        if len(cells) > branch_column:
            match = re.fullmatch(r"`([^`]+)`", cells[branch_column])
            if match:
                branches.append(match.group(1))
    return branches


class Check:
    def __init__(self, root, fix):
        self.root = root
        self.fix = fix
        self.counts = {"DELETE": 0, "FINDING": 0, "UNVERIFIED": 0}
        self.remaining = 0
        self.cutoff = time.time() - 7 * 24 * 60 * 60

    def report(self, kind, path, reason):
        self.counts[kind] += 1
        print(f"{kind} {path.relative_to(self.root).as_posix()}: {reason}")
        if kind != "DELETE" or not self.fix:
            self.remaining += 1

    def delete(self, path, reason):
        if self.fix:
            if linked(path):
                self.report("FINDING", path, "linked entries are never deleted")
                return
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()
        self.report("DELETE", path, reason)

    def github(self, path, args):
        try:
            result = json.loads(run(self.root, ["gh", *args]).stdout)
            if not isinstance(result, list) or any(not isinstance(row, dict) for row in result):
                raise ValueError("expected a JSON array of objects")
            return result
        except (OSError, subprocess.CalledProcessError, ValueError):
            self.report("UNVERIFIED", path, "GitHub CLI unavailable or query failed")
            return None

    def plan(self, path):
        text = path.read_text(encoding="utf-8")
        status = re.search(r"^- \*\*Plan status:\*\* (.*?)\s*$", text, re.M)
        status = status.group(1) if status else None
        valid = status in {"draft", "ready", "in progress", "done"}
        if not valid:
            self.report("FINDING", path, f"invalid Plan status: {status!r}")
        branches = delivery_branches(text)
        if not branches:
            self.report("FINDING", path, "no Deliveries branch")
        if status != "done" or not branches:
            return
        merged = True
        for branch in branches:
            rows = self.github(path, ["pr", "list", "--state", "merged", "--head", branch,
                                      "--json", "number", "--limit", "1"])
            if rows is None:
                return
            merged = merged and bool(rows) and all(isinstance(row.get("number"), int) for row in rows)
        if merged:
            self.delete(path, "every delivery branch has a merged PR")

    def issue(self, path):
        lines = path.read_text(encoding="utf-8").splitlines()
        title = re.fullmatch(r"<!-- title: (.+) -->", lines[0]) if lines else None
        if title is None:
            return
        title = title.group(1)
        rows = self.github(path, ["issue", "list", "--state", "all", "--search",
                                  f"{title} in:title", "--json", "title", "--limit", "20"])
        if rows is not None and any(row.get("title") == title for row in rows):
            self.delete(path, "an issue with the exact draft title exists")

    def documents(self, bucket, handler):
        for path in sorted(bucket.iterdir()):
            if linked(path):
                self.report("FINDING", path, "linked entries are never followed")
            elif not path.is_file() or path.suffix != ".md":
                self.report("FINDING", path, "only Markdown files belong in this bucket")
            else:
                handler(path)

    def newest_mtime(self, path):
        if linked(path):
            self.report("FINDING", path, "linked entries are never followed")
            return None
        newest = path.stat().st_mtime
        if path.is_dir():
            for child in path.iterdir():
                modified = self.newest_mtime(child)
                if modified is None:
                    return None
                newest = max(newest, modified)
        return newest

    def inspect(self, local):
        for path in sorted(local.iterdir()):
            # Do not even stat or list human-owned material.
            if path.name == "keep":
                continue
            if linked(path):
                self.report("FINDING", path, "linked entries are never followed")
            elif path.name == "README.md" and path.is_file():
                continue
            elif path.name in {"execution", "issues", "tmp"} and path.is_dir():
                if path.name == "execution":
                    self.documents(path, self.plan)
                elif path.name == "issues":
                    self.documents(path, self.issue)
                else:
                    for entry in sorted(path.iterdir()):
                        newest = self.newest_mtime(entry)
                        if newest is not None and newest < self.cutoff:
                            self.delete(entry, "newest modification is older than seven days")
            else:
                self.report("FINDING", path, "unexpected local-docs root entry")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project_root", nargs="?", default=".", type=Path)
    parser.add_argument("--fix", action="store_true")
    args = parser.parse_args()
    root = args.project_root.resolve()
    check = Check(root, args.fix)
    code = 2
    try:
        if run(root, ["git", "rev-parse", "--is-inside-work-tree"]).stdout.strip() != "true":
            raise ValueError("project root must be a Git work tree")
        local = root / "local-docs"
        if linked(local):
            raise ValueError("local-docs must not be a linked directory")
        if local.exists():
            run(root, ["git", "check-ignore", "-q", "local-docs/"])
            if not local.is_dir():
                raise ValueError("local-docs must be a directory")
            check.inspect(local)
        code = 1 if check.remaining else 0
    except (OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"UNVERIFIED .: precondition or filesystem operation failed: {error}")
        check.counts["UNVERIFIED"] += 1
    print("Counts: " + ", ".join(f"{kind}={count}" for kind, count in check.counts.items()))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
