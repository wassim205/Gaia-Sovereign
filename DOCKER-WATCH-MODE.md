# Docker Watch Mode - Development Guide

## What is Docker Watch Mode?

Docker Compose watch mode automatically detects file changes and rebuilds/restarts containers without requiring manual `docker compose up --build` commands.

**Benefits:**
- ✅ Auto-rebuild on code changes
- ✅ No manual container restarts needed
- ✅ Faster development workflow
- ✅ Real-time testing of changes
- ✅ Works for both frontend and backend

---

## How to Use

### 1. Start Docker with Watch Mode

```bash
docker compose up --watch
```

**What this does:**
- Starts all containers (db, api, web)
- Monitors file changes in:
  - `apps/api/src/` and `apps/api/package.json`
  - `apps/web/src/`, `apps/web/app/`, `apps/web/components/`, `apps/web/package.json`
- Automatically rebuilds when files change
- Restarts the affected container

### 2. Stop Watch Mode

Press `Ctrl+C` in the terminal

### 3. Start in Background with Watch

If you want to run watch in the background:

```bash
docker compose up --watch -d &
```

---

## What Gets Watched

### Backend (API)
- **Watched Paths:**
  - `apps/api/src/**` - All TypeScript/JavaScript source files
  - `apps/api/package.json` - Dependencies changes
  
- **Action:** `rebuild` - Full container rebuild

### Frontend (Web)
- **Watched Paths:**
  - `apps/web/src/**` - React/utility code
  - `apps/web/app/**` - Next.js app directory
  - `apps/web/components/**` - React components
  - `apps/web/package.json` - Dependencies changes
  
- **Action:** `rebuild` - Full container rebuild

### Database
- **Not watched** - Database changes require manual restart

---

## Examples

### Example 1: Modify Frontend Component

```bash
# Terminal 1: Start Docker with watch
$ docker compose up --watch

# Terminal 2 (or edit while Terminal 1 is running)
# Edit: apps/web/app/dashboard/history/page.tsx
# Change some styling or text

# Watch will automatically:
# 1. Detect the file change
# 2. Rebuild the web container
# 3. Restart the web service
# 4. Apply changes immediately at http://localhost:3000
```

### Example 2: Modify Backend Service

```bash
# Terminal 1: Start Docker with watch
$ docker compose up --watch

# Terminal 2 (or edit while Terminal 1 is running)
# Edit: apps/api/src/audit/audit.controller.ts
# Change an endpoint or add logging

# Watch will automatically:
# 1. Detect the file change
# 2. Rebuild the API container
# 3. Restart the API service
# 4. Apply changes immediately at http://localhost:4000/api
```

### Example 3: Add New NPM Package

```bash
# Terminal 1: Start Docker with watch
$ docker compose up --watch

# Terminal 2 (or edit while Terminal 1 is running)
# Edit: apps/web/package.json
# Add a new dependency

# Watch will automatically:
# 1. Detect package.json change
# 2. Rebuild container (runs npm install)
# 3. Restart the web service
```

---

## Output Example

When you run `docker compose up --watch`, you'll see output like:

```
Creating network "gaiasovereign_default" with the default driver
Creating gaiasovereign-db ... done
Creating gaiasovereign-api ... done
Creating gaiasovereign-web ... done
[+] Running 3/3
 ✔ Container gaiasovereign-db    Running
 ✔ Container gaiasovereign-api   Running
 ✔ Container gaiasovereign-web   Running

[+] Watch mode enabled, watching:
  - ./apps/api/src
  - ./apps/api/package.json
  - ./apps/web/src
  - ./apps/web/app
  - ./apps/web/components
  - ./apps/web/package.json
```

When a file changes:

```
[+] Rebuilding gaiasovereign-web
[+] Building for gaiasovereign-web
[#] Building docker image
[+] Built docker image
[+] Starting container gaiasovereign-web
[+] Container gaiasovereign-web started
```

---

## Comparison: With vs Without Watch Mode

### Without Watch Mode (Old Way)
```bash
# Make changes
$ nano apps/web/app/dashboard/history/page.tsx

# Manually rebuild
$ docker compose up web --build -d

# Wait for rebuild...
# Manually refresh browser
```
**Time**: ~30-60 seconds + manual steps

### With Watch Mode (New Way)
```bash
# Start once
$ docker compose up --watch

# Make changes in your editor
$ nano apps/web/app/dashboard/history/page.tsx

# Automatic rebuild happens in background (~15-30 seconds)
# Auto-reload in browser (if hot reload is configured)
```
**Time**: ~15-30 seconds automatically

---

## Limitations & Notes

### ⚠️ Watch Mode Limitations

1. **Database schema changes** - Requires manual restart
   ```bash
   # Press Ctrl+C to stop
   # Then restart with: docker compose up --watch
   ```

2. **Docker Compose config changes** - Requires manual restart
   - If you edit `docker-compose.yml`, stop and restart watch mode

3. **Env file changes** - Requires manual restart
   - If you edit `.env`, stop and restart watch mode

4. **Native M1/M2 Mac support** - May have performance issues
   - Consider using `docker-desktop` native support or WSL2 on Windows

### ✅ Works Great For

- Frontend code changes (React components, pages, styling)
- Backend code changes (Controllers, services, utilities)
- Configuration file changes in `src/`
- Adding new route handlers
- Modifying business logic

---

## Troubleshooting

### Watch Mode Not Working

**Problem**: Files don't trigger rebuild

**Solution**:
1. Check if Docker Compose version supports watch (v2.22+)
   ```bash
   docker compose version
   ```

2. Stop and restart watch mode:
   ```bash
   docker compose down
   docker compose up --watch
   ```

3. Make sure files are being saved to disk (not just in editor buffer)

### Rebuild Takes Too Long

**Problem**: Container rebuild takes 30+ seconds

**Solution**:
1. This is normal for first rebuild after package changes
2. Subsequent rebuilds should be faster
3. Check Docker resources: More CPU/RAM = faster rebuilds
4. Use `.dockerignore` to exclude unnecessary files

### Changes Not Appearing in Browser

**Problem**: File changed, container rebuilt, but browser shows old content

**Solution**:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache: DevTools → Network → disable cache
3. Check browser console for errors
4. Check container logs: `docker compose logs web`

---

## Advanced Usage

### Only Watch Specific Services

```bash
# Only watch web container
docker compose up web --watch

# Only watch api container
docker compose up api --watch
```

### Disable Watch Mode Temporarily

```bash
# Run without watch
docker compose up

# Then use Ctrl+C to stop
```

### Monitor Logs While Watching

In one terminal:
```bash
# Terminal 1: Run watch mode
docker compose up --watch

# Terminal 2: Watch logs in real-time
docker compose logs -f web
docker compose logs -f api
```

---

## Best Practices

1. **Always use watch mode during development**
   ```bash
   docker compose up --watch
   ```

2. **Keep editor window and browser side-by-side**
   - Edit code on left, refresh browser on right
   - See changes immediately

3. **Monitor logs while watching**
   - Open another terminal for `docker compose logs -f`
   - Catch errors early

4. **Use keyboard shortcuts**
   - **Frontend**: `Ctrl+Shift+R` to hard refresh
   - **API**: Check logs after changes

5. **Test changes immediately**
   - Don't wait for multiple changes
   - Test each change in the browser/API
   - Catch bugs early

---

## Summary

**Docker Watch Mode makes development 2-3x faster by:**
- ✅ Eliminating manual rebuild commands
- ✅ Automatically detecting and reacting to file changes
- ✅ Keeping containers running and healthy
- ✅ Reducing context switching between terminal and editor

**Start using it now:**
```bash
docker compose up --watch
```

Happy coding! 🚀
