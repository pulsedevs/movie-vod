@echo off
echo 🕒 Setting build time...

for /f "tokens=*" %%i in ('powershell -command "([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"') do set BUILD_TIME=%%i
echo Build time: %BUILD_TIME%

rem Set environment variable and run build
set NEXT_PUBLIC_BUILD_TIME=%BUILD_TIME%

rem Create build info file
echo { > public\build-info.json
echo   "buildTime": "%BUILD_TIME%", >> public\build-info.json
echo   "buildDate": "%date% %time%", >> public\build-info.json
echo   "version": "1.0.0" >> public\build-info.json
echo } >> public\build-info.json

echo 📝 Build info written to public\build-info.json

rem Run the build
npm run build:simple

if %errorlevel% equ 0 (
    echo ✅ Build completed successfully!
) else (
    echo ❌ Build failed with error level %errorlevel%
    exit /b %errorlevel%
)
