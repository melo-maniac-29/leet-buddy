# 🗺️ LeetBuddy Development Roadmap

## ✅ Phase 1: COMPLETED (Current Status)

### Backend Infrastructure
- ✅ **PostgreSQL Database** - 3,053 problems + 4,771 solutions loaded
- ✅ **FastAPI REST API** - Running on localhost:8001
- ✅ **Docker Setup** - One-command deployment
- ✅ **Adminer UI** - Database viewer on localhost:8082
- ✅ **Migration Script** - Idempotent data loading

### Chrome Extension Core
- ✅ **GitHub OAuth** - Secure backend token exchange
- ✅ **Repository Auto-Creation** - `leetbuddy-solutions` repo
- ✅ **Notes Panel** - Floating notes on LeetCode pages
- ✅ **Settings Panel** - Toggle switches for features
- ✅ **Progress Stats Page** - Track solved/synced/contributed

### Icons & UI
- ✅ **Extension Icons** - 16x16, 48x48, 128x128 generated
- ✅ **Popup UI** - Connection status, user info, actions
- ✅ **Stats Dashboard** - Visual progress tracking

---

## 🚧 Phase 2: NEEDS TESTING (Priority)

### Extension Features to Test

#### 1. LeetCode Integration
**Status:** Code exists, needs real-world testing
- [ ] **Navigate to LeetCode problem page**
  - Test URL: https://leetcode.com/problems/two-sum/
  - Expected: "📝 Notes" button appears in toolbar
  
- [ ] **Solve & Submit Problem**
  - Write solution in LeetCode editor
  - Click "Submit" and get "Accepted"
  - Expected: Auto-sync modal appears

- [ ] **Notes Functionality**
  - Click "📝 Notes" button
  - Write notes, click "Save"
  - Refresh page - notes should persist

- [ ] **Submission Detection**
  - Submit solution on LeetCode
  - Expected: Extension detects "Accepted" status
  - Should trigger sync/contribute workflow

#### 2. GitHub Sync Testing
**Status:** Backend ready, needs end-to-end test
- [ ] **Auto-Sync After Submission**
  - Enable "Auto-sync on submit" in settings
  - Submit a LeetCode problem
  - Check `leetbuddy-solutions` repo on GitHub
  - Expected: New folder with solution.py, problem.json, notes.md

- [ ] **File Structure Verification**
  ```
  leetbuddy-solutions/
  ├── By-Topic/Array/Easy/0001-two-sum/
  │   ├── solution.py
  │   ├── problem.json
  │   └── notes.md (if enabled)
  └── README.md (auto-generated)
  ```

- [ ] **Multiple Languages**
  - Solve same problem in different languages
  - Expected: Multiple solution files in same folder

#### 3. Contribution System
**Status:** PR creation code exists, needs testing
- [ ] **Detect Missing Solution**
  - Solve a problem with language that doesn't exist in database
  - Expected: "🎉 New Solution!" modal appears

- [ ] **Create Pull Request**
  - Click "✨ Contribute" button
  - Expected: PR created to `melo-maniac-29/leet-buddy`
  - Branch name: `contrib-{language}-{problemId}-{timestamp}`

- [ ] **PR Content Verification**
  - PR should update `processed-data/final_database.json`
  - Should add solution with contributor info
  - Check PR description has problem details

---

## 📋 Phase 3: PLANNED FEATURES

### High Priority

#### 1. Pathway Selection UI
**Description:** Interactive learning path selector
- [ ] **Add Pathways Page**
  - Create `extension/pathways/pathways.html`
  - Show available roadmaps:
    - NeetCode 150 (150 problems)
    - Strivers A2Z DSA (94 problems)
    - Fraz Sheet (305 problems)
    - Arsh Goyal DSA (203 problems)

- [ ] **Progress Tracking**
  - Mark problems as completed
  - Show percentage completion
  - Visual progress bars

- [ ] **Problem List View**
  - Click pathway → see all problems
  - Direct links to LeetCode
  - Mark solved/unsolved

#### 2. Enhanced Problem Browser
**Description:** Browse database problems within extension
- [ ] **Search & Filter Page**
  - Search by title/ID
  - Filter by difficulty (Easy/Medium/Hard)
  - Filter by topic (Array, DP, Graph, etc.)
  - Filter by company (Google, Amazon, etc.)

- [ ] **Solution Viewer**
  - Click problem → see available solutions
  - Syntax highlighting for code
  - Copy to clipboard button
  - Multiple language tabs

- [ ] **Random Problem Generator**
  - "Random Easy/Medium/Hard" button
  - Opens random LeetCode problem
  - Track "daily challenge" streak

#### 3. Statistics Dashboard Enhancement
**Current:** Basic stats (solved, synced, contributed)
**Planned:**
- [ ] **Calendar Heatmap**
  - GitHub-style contribution calendar
  - Shows daily solving activity

- [ ] **Topic Mastery**
  - Pie chart of topics solved
  - Weak areas identification
  - Suggested next problems

- [ ] **Company Tags Analysis**
  - Which companies you've practiced most
  - Target company preparation mode

- [ ] **Difficulty Distribution**
  - Visual breakdown (Easy/Medium/Hard)
  - Time series graph

### Medium Priority

#### 4. Submission History
- [ ] **Local History Storage**
  - Store all submissions in IndexedDB
  - Problem + Solution + Timestamp + Runtime + Memory

- [ ] **History Page**
  - View all past submissions
  - Filter by date/language/difficulty
  - Re-view old solutions

#### 5. Code Comparison
- [ ] **Compare Solutions**
  - Your solution vs Database solutions
  - Side-by-side diff view
  - Performance comparison

#### 6. Settings Enhancements
- [ ] **Folder Structure Options**
  - By Topic (current)
  - By Difficulty
  - By Company
  - By Date

- [ ] **Commit Message Template**
  - Customizable commit messages
  - Variables: {problem}, {difficulty}, {language}

- [ ] **GitHub Branch Strategy**
  - Create branch per solution
  - Automatic merge to main

### Low Priority

#### 7. Social Features
- [ ] **Leaderboard**
  - Track community contributions
  - Top contributors list

- [ ] **Solution Voting**
  - Upvote/downvote solutions
  - Best solution ranking

#### 8. AI Integration
- [ ] **Hint Generator**
  - Progressive hints without spoilers
  - Uses GPT API

- [ ] **Code Explainer**
  - Explain solution step-by-step
  - Complexity analysis

- [ ] **Test Case Generator**
  - Generate additional test cases
  - Edge case suggestions

---

## 🎯 Phase 4: DISTRIBUTION (Future)

### Electron Desktop App
**Goal:** One-click install without Docker knowledge

#### Features
- [ ] **Bundled Backend**
  - Package Python + FastAPI + PostgreSQL
  - Embedded database (SQLite or embedded Postgres)
  - Auto-start on app launch

- [ ] **System Tray App**
  - Always running in background
  - Quick access menu
  - Status indicator (running/stopped)

- [ ] **Easy Setup Wizard**
  - GitHub OAuth setup guide
  - One-click repository creation
  - Extension auto-installation help

- [ ] **Cross-Platform**
  - Windows executable (.exe)
  - macOS app bundle (.dmg)
  - Linux AppImage

#### Build Tools
- [ ] **Electron Builder**
- [ ] **Python Embedding** (PyInstaller or similar)
- [ ] **Auto-updater**

### Alternative: Standalone Installer
- [ ] **Docker Desktop Auto-Install**
- [ ] **PowerShell/Bash setup script**
- [ ] **Pre-built database file**

---

## 🔧 Technical Debt & Improvements

### Extension Optimization
- [ ] **Reduce Bundle Size**
  - Minify JavaScript
  - Remove unused code
  - Compress icons

- [ ] **Performance**
  - Lazy load stats dashboard
  - Cache API responses
  - Debounce auto-save

- [ ] **Error Handling**
  - Better error messages
  - Retry logic for API calls
  - Offline mode detection

### Backend Improvements
- [ ] **API Rate Limiting**
  - Prevent abuse
  - Per-user limits

- [ ] **Caching Layer**
  - Redis for frequently accessed data
  - Reduce database queries

- [ ] **Authentication**
  - JWT tokens for API
  - User sessions

- [ ] **API Documentation**
  - Swagger/OpenAPI docs
  - Example requests

### Database
- [ ] **Search Optimization**
  - Full-text search indexes
  - Topic/company indexes

- [ ] **Data Updates**
  - Automated scraping for new problems
  - Solution update workflow

---

## 🐛 Known Issues

### Extension
1. **Monaco Editor Detection** (leetcode-detector.js)
   - Some LeetCode UI changes might break code extraction
   - Need robust selectors

2. **Submission Timing** (leetcode-detector.js)
   - MutationObserver might miss rapid submissions
   - Need better detection mechanism

3. **GitHub API Rate Limits**
   - 5,000 requests/hour for authenticated users
   - Need to handle 403 gracefully

### Backend
1. **CORS Configuration**
   - Currently allows all origins
   - Need to restrict for production

2. **File Upload Size**
   - Large solutions might fail
   - Need file size limits

---

## 📊 Success Metrics

### User Adoption
- [ ] 100+ Chrome Web Store installs
- [ ] 50+ GitHub stars
- [ ] 10+ community contributions

### Feature Usage
- [ ] 80% users connect GitHub
- [ ] 50% users enable auto-sync
- [ ] 10% users contribute solutions

### Technical
- [ ] API response time < 200ms
- [ ] Extension popup load < 100ms
- [ ] Zero data loss incidents

---

## 🚀 Release Plan

### v1.0 (Current - Local Beta)
- ✅ Core functionality working
- ✅ Local Docker setup
- 🚧 Testing phase

### v1.1 (Next - Public Beta)
- [ ] All Phase 2 tested and working
- [ ] Chrome Web Store submission
- [ ] Basic documentation
- [ ] Demo video

### v1.5 (Enhancements)
- [ ] Pathway selection UI
- [ ] Problem browser
- [ ] Enhanced stats

### v2.0 (Distribution)
- [ ] Electron app
- [ ] One-click installer
- [ ] Auto-updates

---

## 🤝 Contributing

Want to help? Pick any task marked `[ ]` and:
1. Comment on the issue (or create one)
2. Fork the repo
3. Make your changes
4. Submit a PR

Priority order:
1. **Testing Phase 2** - Most critical
2. **Pathway UI** - High user value
3. **Problem Browser** - Core feature
4. **Electron App** - Distribution

---

## 📝 Notes

- **No Railway Deployment Needed** - This is a local-first app
- **Database Updates** - Manual for now, automated later
- **Extension Publishing** - After Phase 2 testing complete
- **Electron App** - Long-term goal for easier distribution

---

Last Updated: January 7, 2026
Status: ✅ Phase 1 Complete | 🚧 Phase 2 Testing | 📋 Phase 3 Planned
