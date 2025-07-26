# Installation Guide

This guide covers installation for complete beginners through advanced users.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Basic Installation](#basic-installation)
- [Desktop Shortcuts](#desktop-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Advanced Setup](#advanced-setup)

## Prerequisites

### Required Software

#### 1. Git
Used to download and manage the code repository.

**Windows:**
- Download from [git-scm.com](https://git-scm.com/download/win)
- During installation, select "Git from the command line and also from 3rd-party software"
- [Video Tutorial](https://www.youtube.com/results?search_query=install+git+windows)

**macOS:**
- Option 1: Install via [Homebrew](https://brew.sh/): `brew install git`
- Option 2: Download from [git-scm.com](https://git-scm.com/download/mac)
- [Video Tutorial](https://www.youtube.com/results?search_query=install+git+mac)

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install git

# Fedora
sudo dnf install git

# Arch
sudo pacman -S git
```

#### 2. Node.js & npm
JavaScript runtime and package manager (npm comes with Node.js).

- Download from [nodejs.org](https://nodejs.org/) (choose LTS version)
- Verify installation:
  ```bash
  node --version  # Should show v20.0.0 or higher
  npm --version   # Should show 10.0.0 or higher
  ```

#### 3. ComfyUI
The backend that ComfyUIMini-Redux-Floxy connects to.

- Follow the [ComfyUI installation guide](https://github.com/comfyanonymous/ComfyUI#installing)
- Make note of your ComfyUI installation path and port (default: 8188)

### Verify Prerequisites

Open a terminal/command prompt and run:
```bash
git --version
node --version
npm --version
```

All commands should return version numbers. If not, revisit the installation steps above.

## Basic Installation

### Step 1: Clone the Repository

Open terminal/command prompt and navigate to where you want to install:

```bash
# Windows example
cd C:\Users\YourName\Documents

# macOS/Linux example
cd ~/Documents

# Clone the repository
git clone https://github.com/jonoo407/ComfyUIMini-Redux-Floxy.git
```

### Step 2: Navigate to the Directory

```bash
cd ComfyUIMini-Redux-Floxy
```

### Step 3: Install Dependencies

```bash
npm install
```

This will download all required packages. It may take 2-5 minutes.

### Step 4: Build the Application

```bash
npm run build
```

This compiles the TypeScript code into JavaScript.

### Step 5: Configure Paths

1. Copy the example configuration:
   ```bash
   # Windows
   copy config\default.example.json config\default.json
   
   # macOS/Linux
   cp config/default.example.json config/default.json
   ```

2. Edit `config/default.json` with a text editor:
   ```json
   {
       "app_port": 3000,
       "comfyui_url": "http://127.0.0.1:8188",
       "comfyui_ws_url": "ws://127.0.0.1:8188",
       "output_dir": "C:\\path\\to\\your\\ComfyUI\\output",
       "input_dir": "C:\\path\\to\\your\\ComfyUI\\input"
   }
   ```
   
   Update the paths to match your ComfyUI installation:
   - **Windows**: Use double backslashes `\\` in paths
   - **macOS/Linux**: Use forward slashes `/` in paths

### Step 6: Start the Application

```bash
npm start
```

You should see:
```
ComfyUIMini server started on http://localhost:3000
```

Open your browser and navigate to `http://localhost:3000`

## Desktop Shortcuts

Create shortcuts for easy access:

### Windows (.bat file)

1. Create a new text file on your desktop
2. Paste this content (update the path):
   ```batch
   @echo off
   cd /d "C:\path\to\ComfyUIMini-Redux-Floxy"
   npm start
   pause
   ```
3. Save as `ComfyUIMini.bat` (make sure it's not `.bat.txt`)
4. Double-click to start

### macOS/Linux (.sh file)

1. Create a new file on your desktop:
   ```bash
   nano ~/Desktop/ComfyUIMini.sh
   ```
2. Add this content (update the path):
   ```bash
   #!/bin/bash
   cd /path/to/ComfyUIMini-Redux-Floxy
   npm start
   ```
3. Make it executable:
   ```bash
   chmod +x ~/Desktop/ComfyUIMini.sh
   ```
4. Double-click to start

### Alternative: Start Menu/Applications

**Windows:**
1. Right-click `ComfyUIMini.bat` → Send to → Desktop (create shortcut)
2. Right-click shortcut → Properties → Change Icon (optional)

**macOS:**
1. Use Automator to create an Application that runs the shell script
2. Save to Applications folder

## Troubleshooting

### Common Issues

#### "npm: command not found"
- Node.js is not installed or not in PATH
- Reinstall Node.js and restart terminal

#### "Cannot find module" errors
- Dependencies not installed properly
- Run `npm install` again
- If specific module missing (e.g., 'ejs'), install it directly:
  ```bash
  npm install ejs
  ```

#### "EADDRINUSE" error
- Port 3000 is already in use
- Change `app_port` in config/default.json to another port (e.g., 3001)

#### Cannot connect to ComfyUI
- Ensure ComfyUI is running
- Check the port in config matches ComfyUI's port
- Try `http://127.0.0.1:8188` instead of `localhost:8188`

#### Build errors
- Clear node_modules and reinstall:
  ```bash
  # Windows
  rmdir /s node_modules
  del package-lock.json
  npm install
  
  # macOS/Linux
  rm -rf node_modules package-lock.json
  npm install
  ```

### Getting Help

1. Check the [FAQ](FAQ.md)
2. Review error messages carefully
3. Ensure all prerequisites are installed
4. Try a fresh installation in a new directory

## Advanced Setup

### Running as a Service

#### Windows (using NSSM)
1. Download [NSSM](https://nssm.cc/download)
2. Install as service:
   ```cmd
   nssm install ComfyUIMini "C:\Program Files\nodejs\node.exe"
   nssm set ComfyUIMini AppDirectory "C:\path\to\ComfyUIMini-Redux-Floxy"
   nssm set ComfyUIMini AppParameters "server.js"
   nssm start ComfyUIMini
   ```

#### Linux (using systemd)
1. Create service file:
   ```bash
   sudo nano /etc/systemd/system/comfyuimini.service
   ```
2. Add content:
   ```ini
   [Unit]
   Description=ComfyUIMini-Redux-Floxy
   After=network.target
   
   [Service]
   Type=simple
   User=youruser
   WorkingDirectory=/path/to/ComfyUIMini-Redux-Floxy
   ExecStart=/usr/bin/node server.js
   Restart=on-failure
   
   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start:
   ```bash
   sudo systemctl enable comfyuimini
   sudo systemctl start comfyuimini
   ```

### Docker Installation

Coming soon - Docker support is planned for future releases.

### Development Setup

For contributing or modifying the code:

```bash
# Install development dependencies
npm install --save-dev

# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

---

[← Back to README](../README.md) | [Next: Configuration →](CONFIGURATION.md)
