# 🚀 Project Setup Guide

## Prerequisites

This project requires:
- **Node.js 20.0.0 or higher** (LTS recommended)
- **npm 10.0.0 or higher** (comes with Node.js)

## 📦 Installing Node.js on Windows

### Option 1: Official Installer (Recommended)

1. **Download Node.js LTS**:
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (currently v20.x or v22.x)
   - Choose the Windows Installer (.msi) for your system (64-bit recommended)

2. **Run the Installer**:
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - ✅ Make sure "Add to PATH" is checked
   - ✅ Include npm package manager
   - Click "Install"

3. **Verify Installation**:
   ```powershell
   node --version
   npm --version
   ```
   You should see versions like:
   - `v20.x.x` or higher for Node.js
   - `10.x.x` or higher for npm

### Option 2: Using Chocolatey (If you have it)

```powershell
choco install nodejs-lts
```

### Option 3: Using Winget (Windows Package Manager)

```powershell
winget install OpenJS.NodeJS.LTS
```

### Option 4: Using NVM for Windows (For managing multiple Node versions)

1. **Install nvm-windows**:
   - Download from: https://github.com/coreybutler/nvm-windows/releases
   - Install `nvm-setup.exe`

2. **Install Node.js 20**:
   ```powershell
   nvm install 20
   nvm use 20
   ```

## ✅ After Installing Node.js

1. **Open a new PowerShell/Terminal window** (important - to reload PATH)

2. **Navigate to project directory**:
   ```powershell
   cd "C:\Users\MON PC\Desktop\my-movie-app"
   ```

3. **Verify Node.js is installed**:
   ```powershell
   node --version
   npm --version
   ```

4. **Install project dependencies**:
   ```powershell
   npm install
   ```

5. **Start development server**:
   ```powershell
   npm run dev
   ```

6. **Open in browser**:
   - Visit: http://localhost:3000

## 🔧 Troubleshooting

### "node is not recognized"
- **Solution**: Restart your terminal/PowerShell window
- If still not working, restart your computer
- Check if Node.js is in PATH: `$env:PATH -split ';' | Select-String node`

### "npm is not recognized"
- Node.js installer should include npm automatically
- Try reinstalling Node.js with "Add to PATH" option checked

### Version mismatch
- This project requires Node.js 20+
- Check your version: `node --version`
- If you have an older version, update Node.js from nodejs.org

### Permission errors
- Run PowerShell as Administrator if needed
- Or use `npm install --legacy-peer-deps` if you encounter peer dependency issues

## 📝 Next Steps

After Node.js is installed and dependencies are installed:

1. **Set up environment variables** (if needed):
   - Copy `.env.example` to `.env` (if it exists)
   - Fill in required API keys and configuration

2. **Run the development server**:
   ```powershell
   npm run dev
   ```

3. **Build for production**:
   ```powershell
   npm run build
   npm start
   ```

## 🎯 Quick Start Commands

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📚 Additional Resources

- [Node.js Official Website](https://nodejs.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [npm Documentation](https://docs.npmjs.com/)
