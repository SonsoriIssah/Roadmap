"""Builds tests/fixtures/trackers.xlsx: a workbook laid out like typical DSA
trackers (a dashboard tab, a problem sheet with "Open ↗" hyperlink cells and
=HYPERLINK formulas, a sheet whose problem column has no header, and a derived
"Next Problems" ranking tab). Run: python3 make_trackers.py
"""
import datetime as dt
from pathlib import Path

from openpyxl import Workbook

wb = Workbook()
dash = wb.active
dash.title = "Dashboard"
dash["A1"] = "DSA Training Dashboard"
dash["A3"] = "Total Problems"
dash["A4"] = 101

ws = wb.create_sheet("DSA Problems")
ws.append(["ID", "Problem", "LC #", "Link", "Topic", "Pattern", "Priority", "Difficulty",
           "Company", "Status", "First Attempt", "Last Attempt", "Solved Independently?", "Next Review (auto)"])
rows = [
    (1, "Contains Duplicate", 217, "formula", "Hash Maps / Sets", "Hash map lookup", "P0", "Easy", "Both", "Mastered", dt.date(2026, 9, 25), None, True, dt.date(2026, 10, 16)),
    (2, "Two Sum", 1, "cell", "Hash Maps / Sets", "Hash map lookup", "P0", "Easy", "Both", "Mastered", dt.date(2026, 9, 25), None, True, dt.date(2026, 10, 16)),
    (3, "Longest Consecutive Sequence", 128, "formula", "Hash Maps / Sets", "Hash map lookup", "P0", "Medium", "Both", "Not Started", None, None, None, None),
    (4, "Best Time to Buy and Sell Stock", 121, None, "Arrays & Strings", "Running state (Kadane / min-so-far)", "P0", "Easy", "Both", "Attempted", dt.date(2026, 10, 1), dt.date(2026, 10, 1), False, dt.date(2026, 10, 8)),
    (5, "Valid Palindrome", 125, "formula", "Two Pointers", "Two pointers", "P0", "Easy", "Both", "Not Started", None, None, None, None),
    (6, "3Sum", 15, "formula", "Two Pointers", "Two pointers", "P1", "Medium", "Both", "Not Started", None, None, None, None),
    (7, "Minimum Window Substring", 76, "formula", "Sliding Window", "Sliding window", "P2", "Hard", "Both", "Not Started", None, None, None, None),
]
for r in rows:
    pid, title, lc, link, *rest = r
    ws.append([pid, title, lc, None, *rest])
    row = ws.max_row
    url = f"https://leetcode.com/problems/{title.lower().replace(' ', '-')}/"
    if link == "formula":
        ws.cell(row=row, column=4).value = f'=HYPERLINK("{url}","Open ↗")'
    elif link == "cell":
        ws.cell(row=row, column=4).value = "Open ↗"
        ws.cell(row=row, column=4).hyperlink = url

mt = wb.create_sheet("Master Tracker")
mt.append([None, "LeetCode URL", "Difficulty", "Pattern", "Secondary Pattern", "Priority", "Status", "Next Review", "Notes"])
mt.append(["Maximum Subarray", "https://leetcode.com/problems/maximum-subarray/", "Easy", "Arrays", "Dynamic Programming", "P0", "Not Started", None, "track the best sum so far"])
mt.append(["Product of Array Except Self", "https://leetcode.com/problems/product-of-array-except-self/", "Medium", "Arrays", "Prefix Sum", "P0", "Solved", None, "prefix and suffix products"])
mt.append(["Encode and Decode Strings (Premium)", "http://buttercola.blogspot.com/2015/09/leetcode-encode-and-decode-strings.html", "Medium", "Arrays", None, "P0", "Not Started", None, "prefix each string with its length"])

nx = wb.create_sheet("Next Problems")
nx["A1"] = "Next Problems — What Should I Solve Next?"
nx.append([])
nx.append(["Rank", "Problem", "Difficulty", "Pattern", "Priority", "Why Next?", "Current Status"])
nx.append([1, "3Sum", "Medium", "Two Pointers", "P0", "High-priority pattern", "Not Started"])

out = Path(__file__).with_name("trackers.xlsx")
wb.save(out)
print("wrote", out)
