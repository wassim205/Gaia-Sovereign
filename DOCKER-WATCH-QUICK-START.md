# 🚀 Docker Watch Mode - Quick Start

## One Command to Enable Auto-Rebuild

### Start Development with Watch Mode
```bash
docker compose up --watch
```

That's it! Now:
- ✅ Frontend changes auto-rebuild instantly
- ✅ Backend changes auto-rebuild instantly  
- ✅ No manual `docker compose up --build` needed
- ✅ Just edit and refresh browser

---

## What Gets Watched

| Service | Watched Paths | Action |
|---------|---------------|--------|
| **API** | `apps/api/src/` | Auto-rebuild |
| **Web** | `apps/web/app/`, `apps/web/components/`, `apps/web/src/` | Auto-rebuild |
| **DB** | Not watched | Manual restart needed |

---

## Usage Example

### Before (Old Way - Manual)
```bash
# 1. Edit files
$ nano apps/web/app/dashboard/history/page.tsx

# 2. Manually rebuild
$ docker compose up web --build -d

# 3. Wait 30+ seconds for rebuild
# 4. Refresh browser manually
```
**Total time**: ~1-2 minutes

### After (New Way - Automatic) ⚡
```bash
# 1. Start watch mode once
$ docker compose up --watch

# 2. Edit files (in another terminal or editor)
$ nano apps/web/app/dashboard/history/page.tsx

# 3. Watch automatically rebuilds (~15-30 seconds)
# 4. Refresh browser and see changes
```
**Total time**: ~30 seconds

---

## When to Use Watch Mode

✅ **Use Watch Mode for:**
- Daily development work
- Testing code changes
- Frontend iterations
- Backend service modifications
- Adding new components/pages

❌ **Don't Need Watch Mode for:**
- One-time container start
- CI/CD pipelines
- Production deployments
- Running tests

---

## Troubleshooting

### "Docker Compose version too old"
Watch mode requires Docker Compose v2.22+

```bash
# Check version
docker compose version

# Update if needed
docker pull docker/compose
```

### "Changes not appearing"
1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Check file was saved**: Verify in your editor
3. **Check logs**: `docker compose logs -f web` or `docker compose logs -f api`

### "Rebuild seems stuck"
- First rebuild takes longer (npm install, build, etc.)
- Subsequent rebuilds are faster
- Check container logs for errors

---

## Advanced Commands

### Run Watch Mode + Show Logs
```bash
# Terminal 1
docker compose up --watch

# Terminal 2 (in another terminal)
docker compose logs -f web  # Watch web logs
docker compose logs -f api  # Watch API logs
```

### Only Watch Specific Service
```bash
# Only watch web container
docker compose up web --watch

# Only watch api container  
docker compose up api --watch
```

### Stop Watch Mode
```bash
# Press Ctrl+C in the terminal where watch is running
```

---

## How It Works

1. **You start watch mode:**
   ```bash
   docker compose up --watch
   ```

2. **Docker monitors file changes:**
   - Watches `apps/api/src/`, `apps/api/package.json`
   - Watches `apps/web/app/`, `apps/web/components/`, `apps/web/src/`, `apps/web/package.json`

3. **When files change:**
   - Docker detects the change
   - Automatically rebuilds the container
   - Restarts the service
   - You see the changes immediately

4. **You benefit from:**
   - ✅ Faster development
   - ✅ Fewer manual commands
   - ✅ Less context switching
   - ✅ More time coding

---

## Pro Tips

💡 **Tip 1**: Use dual monitors or split screen
- Left side: Code editor
- Right side: Browser
- Center: Terminal
- Watch changes appear in real-time

💡 **Tip 2**: Keep server logs visible
```bash
# In a separate terminal, watch logs
docker compose logs -f
```

💡 **Tip 3**: Test immediately after changes
- Edit code
- See rebuild in terminal
- Refresh browser
- Verify changes work

💡 **Tip 4**: Read error messages
- Container errors appear in logs
- Helps debug issues faster
- Check logs before assuming it's broken

---

## Summary

**Docker Watch Mode = Faster Development** 🚀

Instead of:
```
Edit → Manual Rebuild → Wait → Refresh → Test → Edit → ...
```

You get:
```
Edit → Auto Rebuild → Refresh → Test → Edit → ...
```

**Get started now:**
```bash
docker compose up --watch
```

For detailed guide, see: `DOCKER-WATCH-MODE.md`
