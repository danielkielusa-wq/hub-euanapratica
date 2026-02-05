@echo off
echo ========================================
echo   Deploying to Production (Vercel)
echo ========================================
echo First neet to comit
echo git add .
echo git commit -m "Your commit message"
echo.

:: Save current branch
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a

:: Check for uncommitted changes
git diff --quiet
if errorlevel 1 (
    echo [WARNING] You have uncommitted changes!
    echo Please commit or stash them before deploying.
    echo.
    pause
    exit /b 1
)

echo [1/5] Pushing dev branch...
git push origin dev
if errorlevel 1 (
    echo [ERROR] Failed to push dev branch
    pause
    exit /b 1
)

echo [2/5] Switching to main...
git checkout main
if errorlevel 1 (
    echo [ERROR] Failed to checkout main
    pause
    exit /b 1
)

echo [3/5] Merging dev into main...
git merge dev --no-edit
if errorlevel 1 (
    echo [ERROR] Merge conflict! Please resolve manually.
    pause
    exit /b 1
)

echo [4/5] Pushing to production...
git push origin main
if errorlevel 1 (
    echo [ERROR] Failed to push main branch
    pause
    exit /b 1
)

echo [5/5] Switching back to dev...
git checkout dev

echo.
echo ========================================
echo   Deployment successful!
echo   Vercel will auto-deploy in ~1-2 min
echo ========================================
echo.
pause
