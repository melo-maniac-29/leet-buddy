# GitHub Repository Structure for LeetBuddy

## Recommended Structure for User's Personal Repo

```
leetcode-solutions/
├── README.md                          # Auto-generated stats & progress
├── .leetbuddy/
│   └── config.json                    # Extension settings
│
├── By-Topic/                          # Organized by topic
│   ├── Array/
│   │   ├── Easy/
│   │   │   ├── 0001-two-sum/
│   │   │   │   ├── solution.py
│   │   │   │   ├── solution.js
│   │   │   │   └── notes.md         # User's notes
│   │   │   └── 0026-remove-duplicates/
│   │   │       └── ...
│   │   ├── Medium/
│   │   └── Hard/
│   │
│   ├── Dynamic-Programming/
│   │   ├── Easy/
│   │   ├── Medium/
│   │   └── Hard/
│   │
│   └── ... (71 topics total)
│
├── By-Difficulty/                     # Alternate view
│   ├── Easy/
│   ├── Medium/
│   └── Hard/
│
└── Stats/
    ├── progress.json                  # Progress tracking data
    └── activity.json                  # Daily activity log
```

## File Naming Convention

- **Directory:** `{frontend_id}-{title-slug}/`
- **Solution:** `solution.{ext}` or `{language}.{ext}`
- **Notes:** `notes.md`
- **Metadata:** `problem.json`

## Example: Problem #1 (Two Sum)

```
By-Topic/Array/Easy/0001-two-sum/
├── problem.json          # Problem metadata
├── solution.py           # Python solution
├── solution.js           # JavaScript solution
├── solution.cpp          # C++ solution
└── notes.md             # User's notes & approach
```

### problem.json
```json
{
  "problem_id": 1,
  "title": "Two Sum",
  "difficulty": "Easy",
  "topics": ["Array", "Hash Table"],
  "companies": ["Amazon", "Google", "Microsoft"],
  "url": "https://leetcode.com/problems/two-sum/",
  "solved_at": "2026-01-07T14:30:00Z",
  "runtime": "45ms",
  "memory": "13.2MB"
}
```

### notes.md
```markdown
# Two Sum

## Approach
Use hash map for O(n) time complexity.

## Key Insights
- Store complement in hash map
- Single pass solution possible

## Time Complexity
- O(n)

## Space Complexity
- O(n)
```

## Auto-Generated README.md

```markdown
# 🎯 LeetCode Solutions

**Total Solved:** 150 / 3,053 (4.9%)
**Last Updated:** January 7, 2026

## 📊 Progress by Difficulty

| Difficulty | Solved | Total | Percentage |
|------------|--------|-------|------------|
| Easy | 80 | 1,520 | 5.3% |
| Medium | 60 | 1,245 | 4.8% |
| Hard | 10 | 288 | 3.5% |

## 🏆 Progress by Topic

| Topic | Easy | Medium | Hard | Total |
|-------|------|--------|------|-------|
| Array | 15 | 10 | 2 | 27 |
| Dynamic Programming | 5 | 12 | 8 | 25 |
| Tree | 12 | 8 | 3 | 23 |
| ... | ... | ... | ... | ... |

## 📅 Activity Heat Map

```
Jan 2026: ▓▓▓░░░▓▓▓▓░░░░▓▓░░░░░░░░░░░░░░
Dec 2025: ▓▓▓▓▓░░▓▓▓▓░░▓▓▓░░░░░░░░░░░░░░
Nov 2025: ░░▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░
```

## 📁 Repository Structure

- **By-Topic/**: Solutions organized by topic and difficulty
- **By-Difficulty/**: Alternative view by difficulty only
- **Stats/**: Progress tracking and activity logs

---
*Powered by [LeetBuddy](https://github.com/melo-maniac-29/leet-buddy) 🚀*
```

## Benefits of This Structure

1. **Easy Navigation**: Find solutions by topic or difficulty
2. **Version Control**: Each problem in separate folder
3. **Multi-Language**: Multiple solutions per problem
4. **Notes Included**: Your approach and learnings saved
5. **Auto-Generated Stats**: README updates automatically
6. **Searchable**: GitHub's search works perfectly
7. **Shareable**: Clean structure for portfolio
