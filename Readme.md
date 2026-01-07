# 🚀 LeetBuddy - Ultimate LeetCode Learning Platform

> **A comprehensive database of 3,053+ FREE LeetCode problems with topic-based organization, multi-language solutions, and curated learning paths.**

[![Problems](https://img.shields.io/badge/Problems-3,053-brightgreen)](processed-data/final_database.json)
[![Topics](https://img.shields.io/badge/Topics-72-blue)](processed-data/final_database.json)
[![Solutions](https://img.shields.io/badge/Solutions-43.7%25-orange)](processed-data/final_database.json)
[![Languages](https://img.shields.io/badge/Languages-12-red)](processed-data/final_database.json)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Database Features](#-database-features)
- [Database Structure](#-database-structure)
- [Learning Paths](#-learning-paths)
- [Filtering Options](#-filtering-options)
- [Data Sources](#-data-sources)
- [Quick Start](#-quick-start)
- [Next Steps](#-next-steps)
- [Project Status](#-project-status)

---

## 🎯 Overview

**LeetBuddy** is a comprehensive LeetCode learning platform built to help developers master Data Structures and Algorithms through a carefully curated database of **3,053 FREE problems** (no premium required). The database is organized by topics for mastery-based learning, includes solutions in 12 programming languages, and features company tags and curated roadmaps.

### Why LeetBuddy?

- ✅ **100% FREE Problems** - No LeetCode premium required
- 📚 **Topic-Based Mastery** - 72 topics organized for structured learning
- 🎓 **Beginner-Friendly** - First 100 problems are all Easy difficulty
- 💼 **Interview-Ready** - Company tags from FAANG and 25+ top companies
- 🌍 **Multi-Language** - Solutions in 12 languages (C++, Python, Java, etc.)
- 🗺️ **Curated Roadmaps** - NeetCode, Strivers, Fraz, and Arsh Goyal sheets

---

## ✨ Database Features

### 📊 Coverage Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Problems** | 3,053 | 100% |
| **With Official Tags** | 2,993 | 98.0% |
| **With Solutions** | 1,334 | 43.7% |
| **With Company Tags** | 603 | 19.8% |
| **With Roadmaps** | 376 | 12.3% |

### 🎯 Difficulty Distribution

- **Easy**: 1,072 problems (35.1%)
- **Medium**: 1,520 problems (49.8%)
- **Hard**: 461 problems (15.1%)

### 💻 Solution Languages

C++, Python, Python3, Java, JavaScript, TypeScript, Go, Rust, C, C#, Kotlin, Swift

### 🏢 Company Tags

FAANG (Facebook, Amazon, Apple, Netflix, Google) + Microsoft, Bloomberg, Adobe, Uber, Oracle, and 20+ more

---

## 🗂️ Database Structure

### Organization

The database is organized in a **topic-by-topic mastery learning** format:
- **530 topic sections** covering 72 unique algorithmic concepts
- Within each topic: **Easy → Medium → Hard** progression
- First 100 problems are **100% Easy** for beginners

### JSON Schema

```json
{
  "metadata": {
    "total_problems": 3053,
    "version": "4.0.0",
    "organization": "topic_by_topic",
    "last_updated": "2026-01-07"
  },
  "problems": [
    {
      "id": 1,
      "title": "Two Sum",
      "slug": "two-sum",
      "url": "https://leetcode.com/problems/two-sum",
      "difficulty": "Easy",
      "acceptance_rate": 49.8,
      "topics": ["Array", "Hash Table"],
      "official_tags": {
        "topicTags": ["Array", "Hash Table"],
        "companyTags": ["Amazon", "Google", "Microsoft"],
        "hints": ["..."]
      },
      "solutions": {
        "cpp": "...",
        "python": "...",
        "java": "..."
      },
      "company_tags": ["Amazon", "Google"],
      "roadmaps": ["NeetCode 150"],
      "learning_order": 1
    }
  ]
}
```

### Topics Covered (72 Total)

**Core Topics**: Array, String, Hash Table, Dynamic Programming, Math, Sorting, Greedy, Tree, Binary Search, Matrix, Two Pointers, Simulation, Binary Tree, Depth-First Search, Breadth-First Search

**Advanced Topics**: Graph, Stack, Backtracking, Bit Manipulation, Heap (Priority Queue), Prefix Sum, Sliding Window, Design, Linked List, Union Find, Monotonic Stack, Binary Search Tree

**Specialized Topics**: Trie, Segment Tree, Binary Indexed Tree, Topological Sort, Memoization, Divide and Conquer, Queue, Counting Sort, Quickselect, Merge Sort, and more...

---

## 🎓 Learning Paths

### 1. Beginner Path (Easy → Medium)
- **Problems 1-100**: 100% Easy difficulty
- **Problems 101-500**: Gradual introduction of Medium problems
- **Focus**: Core topics like Arrays, Strings, Hash Tables, Basic Math

### 2. Interview Preparation Path
- **NeetCode 150**: 150 curated problems covering all major topics
- **Strivers A2Z**: Comprehensive roadmap from basics to advanced
- **Company-Specific**: Filter by target companies (FAANG, etc.)

### 3. Topic Mastery Path
- **72 Topics**: Master one topic at a time
- **Progressive Difficulty**: Easy → Medium → Hard within each topic
- **530 Sections**: Organized for focused learning

### 4. Company-Focused Path
- **25+ Companies**: Amazon (122), Google (98), Microsoft (86), etc.
- **Real Interview Questions**: Tagged by actual company asks
- **FAANG Filter**: Focus on top-tier tech companies

---

## 🔍 Filtering Options

The database supports **7 types of filtering**:

1. **By Topic** (72 options)
   - Array, String, Dynamic Programming, Tree, Graph, etc.

2. **By Difficulty** (3 levels)
   - Easy, Medium, Hard

3. **By Company** (25+ companies)
   - Amazon, Google, Microsoft, Facebook, Apple, etc.

4. **By Roadmap** (3 curated lists)
   - NeetCode 150, Strivers A2Z DSA Sheet, Fraz Sheet

5. **By Language** (12 languages)
   - Filter problems with solutions in specific languages

6. **By Acceptance Rate**
   - Sort by success rate for confidence building

7. **Combined Filters**
   - Multiple filters simultaneously (e.g., "Array + Easy + Amazon")

---

## 📦 Data Sources

This database was built by aggregating data from multiple high-quality sources:

### Primary Sources
1. **[NeetCode](https://github.com/neetcode-gh/leetcode)** - 669 problems × 12 languages
2. **[Interview_DS_Algo](https://github.com/MAZHARMIK/Interview_DS_Algo)** - 1,184 C++ solutions
3. **[Strivers A2Z DSA Sheet](https://github.com/Codensity30/Strivers-A2Z-DSA-Sheet)** - 94 problems
4. **[All DSA Sheets](https://github.com/GFGSC-RTU/All-DSA-Sheets)** - Fraz (305), Arsh Goyal (203)

### Official Data
- **LeetCode GraphQL API** - Official tags, company tags, hints for all 3,053 problems

### Data Processing
- ✅ Merged 5+ data sources
- ✅ Fetched official tags via LeetCode API
- ✅ Fixed ID mismatches using slug-based matching
- ✅ Organized by topic-based mastery learning
- ✅ Verified quality: **9.5/10 score**

---

## 🚀 Quick Start

### Access the Database

```bash
# Clone the repository
git clone https://github.com/yourusername/leet-buddy.git
cd leet-buddy

# Access the database
cat processed-data/final_database.json
```

### Load in Python

```python
import json

# Load the database
with open('processed-data/final_database.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Access metadata
print(f"Total Problems: {data['metadata']['total_problems']}")

# Get all problems
problems = data['problems']

# Filter by difficulty
easy_problems = [p for p in problems if p['difficulty'] == 'Easy']

# Filter by topic
array_problems = [p for p in problems if 'Array' in p['topics']]

# Filter by company
amazon_problems = [p for p in problems if 'Amazon' in p.get('company_tags', [])]

# Get first 100 beginner problems
beginner_path = problems[:100]
```

### Load in JavaScript

```javascript
const fs = require('fs');

// Load the database
const data = JSON.parse(fs.readFileSync('processed-data/final_database.json', 'utf8'));

// Access metadata
console.log(`Total Problems: ${data.metadata.total_problems}`);

// Filter by difficulty
const mediumProblems = data.problems.filter(p => p.difficulty === 'Medium');

// Filter by topic
const dpProblems = data.problems.filter(p => p.topics.includes('Dynamic Programming'));

// Filter by company
const googleProblems = data.problems.filter(p => 
  p.company_tags && p.company_tags.includes('Google')
);
```

---

## 🛠️ Next Steps

### Planned Features

#### 1. Chrome Extension 🔌
- **Filter Panel**: Topics, difficulty, companies, roadmaps, languages
- **Learning Modes**: Beginner path, Interview prep, Topic mastery
- **Progress Tracking**: Solved markers, topic progress, streak counter
- **Smart Recommendations**: Next problem suggestions based on progress

#### 2. Backend API 🌐
- **FastAPI Server**: RESTful API for database access
- **Filtering Endpoints**: Complex multi-filter queries
- **User Progress**: Track completed problems, time spent, success rate
- **Analytics**: Learning patterns, weak topics, improvement suggestions

#### 3. AI Assistance Layer 🤖
- **Hint Generation**: Progressive hints without spoiling solutions
- **Explanation Engine**: Detailed problem explanations
- **Solution Review**: Analyze user code, suggest optimizations
- **Learning Path**: Personalized recommendations based on performance

#### 4. GitHub Auto-Commit 📝
- **Automatic Sync**: Push solutions to GitHub after solving
- **Organized Structure**: Folder structure by topic and difficulty
- **README Generation**: Auto-generate README with problem list
- **Progress Badges**: Display stats and achievements

---

## 📈 Project Status

### ✅ Completed (Phase 1: Data Collection & Processing)

- [x] Collect 3,053 FREE LeetCode problems
- [x] Fetch official tags from LeetCode API
- [x] Merge solutions from multiple sources
- [x] Organize database: Topic → Difficulty
- [x] Fix ID mismatches (73 problems)
- [x] Verify database quality (9.5/10 score)
- [x] Clean workspace (remove temporary files)

### 🚧 In Progress (Phase 2: Development)

- [ ] Chrome Extension UI/UX design
- [ ] Backend API with FastAPI
- [ ] User authentication & progress tracking
- [ ] AI assistance integration

### 📋 Planned (Phase 3: Enhancement)

- [ ] Mobile app (React Native)
- [ ] Community features (discussions, study groups)
- [ ] Video explanations integration
- [ ] Contest simulation mode

---

## 📊 Database Quality Metrics

| Metric | Score | Status |
|--------|-------|--------|
| **Overall Quality** | 9.5/10 | ✅ Excellent |
| **Problem Coverage** | 100% | ✅ Complete |
| **Tag Coverage** | 98.0% | ✅ Excellent |
| **Solution Coverage** | 43.7% | ⚠️ Good |
| **Company Tags** | 19.8% | ⚠️ Partial |
| **Learning Path Quality** | 9.5/10 | ✅ Excellent |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Add Solutions**: Contribute solutions in any of the 12 languages
2. **Update Company Tags**: Add more company-specific tags
3. **Improve Documentation**: Enhance README and guides
4. **Report Issues**: Found a bug? Open an issue
5. **Feature Requests**: Suggest new features

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/leet-buddy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/leet-buddy/discussions)

---

**Made with ❤️ for the coding community**

*Last Updated: January 7, 2026*
