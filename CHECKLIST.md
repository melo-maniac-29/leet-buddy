# ✅ LeetBuddy - Quick Start Checklist

## Before You Test

### 1. GitHub OAuth Setup (5 minutes)

- [ ] Go to: https://github.com/settings/developers
- [ ] Click "New OAuth App"
- [ ] Fill in:
  - **Application name**: LeetBuddy
  - **Homepage URL**: https://github.com/melo-maniac-29/leet-buddy
  - **Authorization callback URL**: `chrome-extension://YOUR_EXTENSION_ID/` (get after installing)
- [ ] Click "Register application"
- [ ] Copy **Client ID** and **Client Secret**
- [ ] Update `.env` file
- [ ] Update `extension/background/background.js` (lines 4-5)

### 2. Create Extension Icons (Optional but recommended)

- [ ] Create 3 PNG files: 16x16, 48x48, 128x128
- [ ] Save in `extension/assets/`
- [ ] Or use placeholders for now (extension will still work)

### 3. Test Docker Installation

```powershell
docker --version
docker-compose --version
```

- [ ] Docker installed and running
- [ ] Docker Compose installed

---

## Installation Steps

### Backend Setup (10 minutes)

```powershell
# Navigate to project
cd c:\Users\allen\works\leet-buddy

# Start containers
docker-compose up -d

# Wait 10 seconds...
Start-Sleep -Seconds 10

# Run migration
python migrate.py
```

**Expected output:**
```
✅ Loaded 3,053 problems
✅ Migration completed successfully!
📈 Statistics:
   Problems: 3,053
   Solutions: 4,771
```

- [ ] Containers running: `docker ps`
- [ ] API accessible: http://localhost:8000
- [ ] API docs: http://localhost:8000/docs

### Extension Installation (2 minutes)

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select: `c:\Users\allen\works\leet-buddy\extension`
5. Copy extension ID (e.g., `abcdefghijklmnop`)
6. Update GitHub OAuth callback URL with this ID

- [ ] Extension loaded successfully
- [ ] No errors in console
- [ ] Icon appears in toolbar

---

## First Test (15 minutes)

### Test 1: API Endpoints

```powershell
# Test root
curl http://localhost:8000

# Get problems
curl http://localhost:8000/api/problems?limit=5

# Get specific problem
curl http://localhost:8000/api/problems/1

# Get solutions
curl http://localhost:8000/api/solutions/1

# Get stats
curl http://localhost:8000/api/stats
```

- [ ] All endpoints respond
- [ ] Data looks correct
- [ ] No errors

### Test 2: Extension Connection

1. Click LeetBuddy icon
2. Click "Connect GitHub"
3. Authorize on GitHub
4. Extension shows "Connected"

- [ ] OAuth flow works
- [ ] User info displayed
- [ ] Repository auto-created: `https://github.com/YOUR_USERNAME/leetcode-solutions`

### Test 3: Notes Feature

1. Go to: https://leetcode.com/problems/two-sum/
2. Click "📝 Notes" button in toolbar
3. Type some notes
4. Click "💾 Save"
5. Refresh page
6. Click "📝 Notes" again

- [ ] Notes button appears
- [ ] Panel opens/closes
- [ ] Notes persist after refresh

### Test 4: Auto-Sync (Full Flow)

1. Go to: https://leetcode.com/problems/two-sum/
2. Write solution:
```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            if target - num in seen:
                return [seen[target - num], i]
            seen[num] = i
```
3. Submit solution
4. Wait for "Accepted" ✅
5. Check console (F12): Should see "🎉 Submission accepted!"
6. Go to your GitHub repo
7. Check if files uploaded

- [ ] Submission detected
- [ ] Files uploaded to GitHub:
  - [ ] `By-Topic/Array/Easy/0001-two-sum/solution.py`
  - [ ] `By-Topic/Array/Easy/0001-two-sum/problem.json`
  - [ ] `By-Topic/Array/Easy/0001-two-sum/notes.md` (if had notes)

### Test 5: Contribution Flow

1. Solve problem in Rust or Ruby (languages with fewer solutions)
2. Submit and get "Accepted"
3. Modal should appear: "🎉 New Solution!"
4. Click "✨ Contribute"
5. Check backend logs: `docker logs leetbuddy-api`

- [ ] Contribution modal appears
- [ ] API receives contribution
- [ ] Check PostgreSQL: `pending_contributions` table has new entry

```powershell
# Check pending contributions
docker exec -it leetbuddy-db psql -U leetbuddy_user -d leetbuddy -c "SELECT * FROM pending_contributions LIMIT 5;"
```

---

## Troubleshooting

### Issue: Docker containers won't start

```powershell
# Check Docker is running
docker ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Nuclear option: rebuild
docker-compose down
docker-compose up -d --build
```

### Issue: Extension not detecting submissions

1. Open console on LeetCode (F12)
2. Look for errors
3. Check if detector loaded: Should see "🚀 LeetBuddy: Detector loaded"
4. Try refreshing page
5. Check manifest.json matches current LeetCode URL structure

### Issue: GitHub sync not working

1. Check extension console: Right-click icon → "Inspect popup"
2. Check background worker: `chrome://extensions` → LeetBuddy → "Service worker" → "Inspect"
3. Look for GitHub API errors
4. Verify token has "repo" scope
5. Check repository exists on GitHub

### Issue: Notes not saving

1. Check Chrome storage: `chrome://extensions` → LeetBuddy → "Inspect popup" → Console
2. Run: `chrome.storage.local.get(null, console.log)`
3. Should see stored notes
4. Clear storage and try again: `chrome.storage.local.clear()`

---

## Success Indicators

### Backend
✅ API responds at http://localhost:8000
✅ Database has 3,053 problems
✅ Can query problems and solutions
✅ Contribution endpoint works

### Extension
✅ Loads without errors
✅ GitHub OAuth connects
✅ Personal repo created
✅ Notes panel works
✅ Settings persist

### Integration
✅ Submission detected on LeetCode
✅ Code extracted correctly
✅ Files uploaded to GitHub in correct structure
✅ Contribution prompt appears for missing solutions
✅ Stats update after actions

---

## Ready for Launch!

Once all checkboxes are ticked, you have:

- ✅ Working backend with 3,053 problems
- ✅ Chrome extension with GitHub integration
- ✅ Auto-sync functionality
- ✅ Contribution system
- ✅ Notes feature

**Next steps:**
1. Polish UI/UX
2. Add extension icons
3. Write launch README
4. Create demo GIFs/videos
5. Prepare social media posts
6. Submit to Chrome Web Store
7. Launch! 🚀

---

## Additional Testing

### Stress Test
- [ ] Solve 10+ problems in a row
- [ ] Check GitHub repo structure
- [ ] Verify all files uploaded correctly
- [ ] Check stats accuracy

### Edge Cases
- [ ] Very long code (10,000+ lines)
- [ ] Special characters in code
- [ ] Multiple languages for same problem
- [ ] Empty notes
- [ ] Duplicate submissions

### Browser Compatibility
- [ ] Chrome (primary)
- [ ] Edge (Chromium-based, should work)
- [ ] Brave (Chromium-based, should work)

---

**Happy Testing! 🎉**

If all tests pass, you're ready to change how developers contribute to open source!
