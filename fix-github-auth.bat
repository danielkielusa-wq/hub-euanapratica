@echo off
echo ========================================
echo   Fix GitHub Authentication
echo ========================================
echo.
echo Clearing cached GitHub credentials...
echo url=https://github.com | git credential-manager erase
echo.
echo Done! Now try your deploy.bat again.
echo You'll be prompted for:
echo   Username: Your GitHub username
echo   Password: Your Personal Access Token (NOT your password)
echo.
echo To generate a token:
echo   1. Go to: https://github.com/settings/tokens
echo   2. Click "Generate new token (classic)"
echo   3. Select 'repo' scope
echo   4. Copy the generated token
echo.
pause
