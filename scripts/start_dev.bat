@echo off

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo NPM is not installed. Please install NPM and Node.js and try again.
    pause
    exit /b
)

echo Starting ComfyUIMini in development mode with hot reloading...
echo.
echo This will start both the server and client in watch mode.
echo The server will automatically restart when you make changes to server files.
echo The client will automatically recompile when you make changes to client files.
echo.
echo Press Ctrl+C to stop the development server.
echo.

call npm run dev 