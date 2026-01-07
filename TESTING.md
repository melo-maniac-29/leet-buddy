# 🚀 LeetBuddy - Testing Guide

## Quick Start

### 1. Setup Backend (Docker + PostgreSQL + FastAPI)

```powershell
# From project root
cd c:\Users\allen\works\leet-buddy

# Copy environment template
cp .env.example .env

# Edit .env with your GitHub OAuth credentials
# Get them at: https://github.com/settings/developers

# Start Docker containers
docker-compose up -d

# Wait 10 seconds for PostgreSQL to initialize...

# Run database migration
python migrate.py
```

**Expected Output:**
```
✅ Loaded 3,053 problems
✅ Migration completed successfully!
📈 Statistics:
   Problems: 3,053
   Solutions: 4,771
   Topics: 71
   Companies: XXX
```

### 2. Test API

```powershell
# Check API is running
curl http://localhost:8000

# Get all problems
curl http://localhost:8000/api/problems?limit=10

# Get specific problem
curl http://localhost:8000/api/problems/1

# Get solutions for problem
curl http://localhost:8000/api/solutions/1

# Check stats
curl http://localhost:8000/api/stats
```

### 3. Install Chrome Extension

```
1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select folder: c:\Users\allen\works\leet-buddy\extension
5. Extension installed! ✅
```

### 4. Configure Extension

```
1. Click LeetBuddy icon in toolbar
2. Click "Connect GitHub"
3. Authorize with GitHub
4. Extension will auto-create "leetcode-solutions" repo
5. Done! ✅
```

### 5. Test on LeetCode

```
1. Go to: https://leetcode.com/problems/two-sum/
2. Write a solution
3. Submit and get "Accepted"
4. Extension will:
   ✅ Detect submission
   ✅ Show notes panel (click "📝 Notes" button)
   ✅ Auto-sync to your GitHub repo
   ✅ Prompt for contribution (if solution missing)
```

## Expected GitHub Repository Structure

After syncing a few problems, your repo should look like:

```
leetcode-solutions/
├── README.md (auto-generated)
├── By-Topic/
│   ├── Array/
│   │   ├── Easy/
│   │   │   └── 0001-two-sum/
│   │   │       ├── solution.py
│   │   │       ├── problem.json
│   │   │       └── notes.md
│   │   ├── Medium/
│   │   └── Hard/
│   └── Dynamic-Programming/
│       ├── Easy/
│       ├── Medium/
│       └── Hard/
```

## Testing Checklist

### Backend Tests
- [ ] Docker containers start successfully
- [ ] PostgreSQL database initialized
- [ ] Migration script runs without errors
- [ ] API responds at http://localhost:8000
- [ ] Can fetch problems list
- [ ] Can fetch specific problem
- [ ] Can fetch solutions for problem
- [ ] Stats endpoint works

### Extension Tests
- [ ] Extension loads in Chrome
- [ ] GitHub OAuth works
- [ ] Repository auto-created
- [ ] Settings save properly
- [ ] Notes panel appears on LeetCode
- [ ] Notes save and persist
- [ ] Template button works

### Integration Tests
- [ ] Submission detected on LeetCode
- [ ] Code extracted correctly
- [ ] Solution synced to GitHub
- [ ] Files uploaded in correct structure
- [ ] Notes included if enabled
- [ ] Contribution prompt shows for missing solutions
- [ ] Stats update after sync

## Troubleshooting

### Docker Issues
```powershell
# Check containers
docker ps

# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Stop and remove
docker-compose down
```

### API Not Starting
```powershell
# Check PostgreSQL health
docker exec -it leetbuddy-db pg_isready -U leetbuddy_user

# Check API logs
docker logs leetbuddy-api

# Rebuild API
docker-compose up -d --build api
```

### Extension Issues
```
1. Check console for errors: Right-click extension → Inspect popup
2. Check background worker: chrome://extensions → LeetBuddy → Service worker → Inspect
3. Check content script: Open LeetCode → F12 → Console
4. Reload extension: chrome://extensions → Reload button
```

### GitHub Sync Issues
```
Common issues:
- GitHub token not set: Reconnect GitHub in extension
- Repository not found: Click "Select Repository" in popup
- Permission denied: Check GitHub token has "repo" scope
- Rate limit: Wait 1 hour or use personal access token
```

## Manual Testing Steps

### 1. Test Notes Feature
```
1. Go to any LeetCode problem
2. Click "📝 Notes" button (top toolbar)
3. Type some notes
4. Click "💾 Save"
5. Refresh page
6. Click "📝 Notes" again
7. Notes should be persisted ✅
```

### 2. Test Auto-Sync
```
1. Solve a LeetCode problem
2. Submit solution
3. Wait for "Accepted" verdict
4. Check Chrome console for: "🎉 Submission accepted!"
5. Go to your GitHub repo
6. Verify files uploaded ✅
```

### 3. Test Contribution
```
1. Solve problem in a language we don't have (check final_database.json)
2. Submit solution
3. Contribution modal should appear
4. Click "✨ Contribute"
5. Check backend logs: docker logs leetbuddy-api
6. Should see POST to /api/contribute ✅
```

## Configuration Files

### .env
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REPO_OWNER=melo-maniac-29
GITHUB_REPO_NAME=leet-buddy
```

### extension/background/background.js
```javascript
// Line 4-5: Update these
const GITHUB_CLIENT_ID = 'your_github_client_id';
const GITHUB_CLIENT_SECRET = 'your_github_client_secret';
```

## Next Steps After Testing

1. **Create GitHub OAuth App**
   - Go to: https://github.com/settings/developers
   - New OAuth App
   - Callback URL: Copy from extension (chrome-extension://...)

2. **Update OAuth Credentials**
   - Update .env file
   - Update extension/background/background.js

3. **Test Full Flow**
   - Connect GitHub
   - Solve problem
   - Verify sync
   - Test contribution

4. **Polish**
   - Add icon images (extension/assets/)
   - Test on multiple problems
   - Verify all difficulty levels
   - Test all features

## Success Criteria

✅ All 3,053 problems loaded into PostgreSQL
✅ API returns correct data
✅ Extension connects to GitHub
✅ Solutions sync to structured repo
✅ Notes saved and uploaded
✅ Contribution flow works
✅ No errors in console

You're ready to open source! 🎉
