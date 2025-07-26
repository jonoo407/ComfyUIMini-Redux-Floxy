# ComfyUIMini-Redux-Floxy

> **Enhanced mobile-friendly UI for ComfyUI with quality of life improvements and professional workflows**

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/jonoo407/ComfyUIMini-Redux-Floxy)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-AGPL--3.0-orange)](LICENSE)

<p align="center">
  <img src="https://github.com/user-attachments/assets/78a52443-ac9c-498c-8df3-129acd94a48c" alt="App Preview" width="600">
</p>

## ✨ What Makes This Fork Special

This enhanced fork of [ComfyUIMini-Redux](https://github.com/a1lazydog/ComfyUIMini-Redux) adds **professional features** and **UI improvements** that streamline your AI image generation workflow:

### 🚀 Key Enhancements

- **🗑️ One-Click Clear All** - Clear all prompts instantly
- **💀 Individual Clear Buttons** - Selective field clearing with animations
- **🎲 Extended Seed Control** - Randomizer for both `seed` and `noise_seed`
- **🎥 Video Support** - Full MP4 gallery integration
- **📱 Mobile PWA** - Install as app on your phone
- **🌐 Remote Access Ready** - Tailscale integration guide
- **⚡ RTX 5090 Optimized** - Professional workflows included

### 📦 Included Professional Workflows

1. **flux_floxy** - RTX 5090 optimized with Detail Daemon + Face Detailer
2. **Kontext Suite** - Advanced image editing and composition
3. **SUPIR Upscaling** - State-of-the-art AI enhancement
4. Plus 4 more specialized workflows

[→ View all workflows and models](docs/WORKFLOWS.md)

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v20.0.0+
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) (latest version recommended)
- Git (for cloning the repository)

### Installation (3 Minutes)

```bash
# Clone the repository
git clone https://github.com/jonoo407/ComfyUIMini-Redux-Floxy.git
cd ComfyUIMini-Redux-Floxy

# Install dependencies and build
npm install
npm run build

# Update paths in config/default.json to match your ComfyUI installation
# Edit output_dir and input_dir paths

# Start the application
npm start
```

✅ **Security**: All npm vulnerabilities have been fixed (0 vulnerabilities)

Open `http://localhost:3000` in your browser.

**Need detailed instructions?** → [Complete Installation Guide](docs/INSTALLATION.md)

## 📱 Mobile Access

Access your workflows from anywhere:

1. **Same Network**: Navigate to `http://YOUR-PC-IP:3000` on mobile
2. **Remote Access**: [Set up Tailscale](docs/CONFIGURATION.md#remote-access-setup) for secure access
3. **Install as App**: Add to home screen for native app experience

## 🎯 Features

<details>
<summary><b>Quality of Life Improvements</b></summary>

- **Clear All Button** - One-click prompt clearing
- **Individual Clear Icons** - Skull buttons with hover effects
- **Extended Randomizer** - Works on all seed inputs
- **Smart Focus** - Auto-focus cleared fields
- **Professional UI** - Smooth animations and flexbox layouts

[→ See all features](docs/FEATURES.md)
</details>

<details>
<summary><b>Enhanced Capabilities</b></summary>

- **Video Generation Support** - Full MP4 workflow compatibility
- **Advanced Gallery** - Subfolder navigation and modal viewing
- **Metadata Preservation** - Separate .meta files for workflows
- **Auto-Conversion** - Import any ComfyUI workflow format
- **Queue Management** - Real-time progress tracking

[→ Technical details](docs/FEATURES.md#enhanced-capabilities)
</details>

## 🔧 Configuration

Basic configuration in `config/default.json`:

```json
{
    "app_port": 3000,
    "comfyui_url": "http://127.0.0.1:8188",
    "comfyui_ws_url": "ws://127.0.0.1:8188",
    "output_dir": "path/to/comfyui/output",
    "input_dir": "path/to/comfyui/input"
}
```

[→ Advanced configuration options](docs/CONFIGURATION.md)

## 🐛 Recent Bug Fixes

### Node ID Colon Bug (Fixed: January 26, 2025)
Fixed an issue where workflow inputs for nodes with colons in their IDs (e.g., "54:0", "54:1") weren't saving or loading correctly. The bug was caused by ID sanitization not being properly reversed during parsing. 

**Symptoms**: Prompt changes wouldn't persist for certain nodes, always reverting to default values.  
**Solution**: Updated ID parsing logic to properly handle sanitized node IDs.  
**Status**: ✅ Fixed in current version

## 📚 Documentation

- [**Installation Guide**](docs/INSTALLATION.md) - Detailed setup instructions
- [**Workflows & Models**](docs/WORKFLOWS.md) - All included workflows with download links
- [**Configuration**](docs/CONFIGURATION.md) - Port setup, remote access, customization
- [**Features**](docs/FEATURES.md) - Complete feature documentation
- [**FAQ**](docs/FAQ.md) - Common questions and troubleshooting

## 🤝 Credits & Support

### Original Projects
- **ComfyUIMini**: [ImDarkTom](https://github.com/ImDarkTom/ComfyUIMini) - [Support](https://www.buymeacoffee.com/ImDarkTom)
- **ComfyUIMini-Redux**: [a1lazydog](https://github.com/a1lazydog/ComfyUIMini-Redux) - [Support](https://www.buymeacoffee.com/bjew)

### This Fork
Enhanced by **jonoo407** for professional workflows and improved UX.

<a href="https://coff.ee/kwude1bkpg" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>

---

**🌐 Professional AI Services**: [floxy.net](https://floxy.net) | **📝 License**: [AGPL-3.0](LICENSE)
