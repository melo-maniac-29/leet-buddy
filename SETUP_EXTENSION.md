# 🚀 Extension Setup Guide

## Step 1: Get Extension Redirect URI

1. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked"
   - Select `extension` folder
   
2. Open Chrome DevTools Console (F12)
3. Click on extension icon
4. Copy the redirect URI from console:
   ```
   🔑 LeetBuddy Redirect URI: chrome-extension://xxxxx...
   ```

## Step 2: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** `LeetBuddy`
   - **Homepage URL:** `https://github.com/melo-maniac-29/leet-buddy`
   - **Authorization callback URL:** Paste the redirect URI from Step 1
   - **Description:** Auto-sync LeetCode solutions to GitHub

4. Click **"Register application"**
5. Copy **Client ID**
6. Click **"Generate a new client secret"**
7. Copy **Client Secret** (save it somewhere safe!)

## Step 3: Configure Extension

1. Open `extension/background/background.js`
2. Replace line 5:
   ```javascript
   const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
   ```
   With your actual Client ID:
   ```javascript
   const GITHUB_CLIENT_ID = 'Ov23liABCDEF1234567';  // Your actual ID
   ```

3. Save the file

## Step 4: Configure Backend (for OAuth)

1. Create `.env` file in project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add:
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

3. Restart Docker:
   ```bash
   docker-compose restart
   ```

## Step 5: Reload Extension

1. Go to `chrome://extensions/`
2. Click the refresh icon on LeetBuddy extension
3. Click extension icon
4. Click **"Connect GitHub"**

## ✅ Verification

If everything works:
- ✅ OAuth popup opens
- ✅ You see GitHub authorization page
- ✅ After approving, extension shows "Connected"
- ✅ Your GitHub username appears

## ❌ Troubleshooting

**"Authorization page could not be loaded"**
- Check Client ID is correct in `background.js`
- Check redirect URI matches in GitHub OAuth app settings
- Reload extension after changes

**"Failed to exchange token"**
- Check `.env` has correct Client Secret
- Restart Docker: `docker-compose restart`
- Check API is running: `curl http://localhost:8001/`

**Extension not working on LeetCode**
- Hard refresh LeetCode page (Ctrl+Shift+R)
- Check DevTools console for errors
- Verify content scripts loaded

## 🔐 Security Notes

- ✅ Client Secret is only in `.env` (never in extension code)
- ✅ `.env` is in `.gitignore` (won't be committed)
- ✅ Users get tokens via secure OAuth flow
- ✅ Each user uses their own GitHub account

---

**Need help?** Check [README.md](README.md) or open an issue on GitHub!
