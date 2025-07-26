# ComfyUIMini-Redux-Floxy

**Personal fork of ComfyUIMini-Redux with quality of life improvements and enhanced UI features**

A mobile-friendly PWA to run ComfyUI workflows with advanced features and optimizations.

![App Preview](https://github.com/user-attachments/assets/78a52443-ac9c-498c-8df3-129acd94a48c)

## About This Fork

This is a personal fork of [ComfyUIMini-Redux](https://github.com/a1lazydog/ComfyUIMini-Redux) focused on:
- 🔧 **Quality of Life Improvements**: Enhanced user experience and workflow efficiency
- 🎯 **Professional Workflows**: Optimized for advanced AI image generation pipelines
- 📱 **Enhanced UI/UX**: Improved interface design and mobile optimization
- ⚡ **Performance Enhancements**: Better workflow management and processing efficiency

## Features

-   ⚡ Lightweight UI built for mobile devices
-   💾 Workflows saved to device or PC
-   ⏳ Progress info when generating images
-   🤖 Enhanced automatic workflow importing
-   🖼️ Gallery with advanced image & video support
-   📱 **PWA support** for standalone mobile app experience
-   🔄 **Advanced Queue Management** with real-time progress tracking
-   🎥 **Video Support**: Full MP4 video generation and playback
-   🔧 **Professional Metadata Management**: Separate .meta files preserve original workflows

## Recent Enhancements

### 🎥 **Advanced Gallery**
- **Video Support**: Full MP4 video file support alongside images
- **Subfolder Navigation**: Enhanced navigation through complex folder structures
- **Enhanced Modal System**: Improved viewing experience for images and videos
- **Smart Folder Traversal**: Intuitive navigation up and down through gallery subfolders

### 🔧 **Professional Workflow Management**
- **Metadata Preservation**: Workflow metadata stored in separate `.meta` files
- **Enhanced Node Support**: Full BOOLEAN node support and advanced parameter handling
- **API Format Auto-Conversion**: Seamless workflow import from any ComfyUI format

### ⚡ **Performance & UX**
- **Quality of Life Enhancements**: Streamlined workflow management and improved user experience
- **Smart Queue Management**: Automatic image queuing and progress tracking
- **Dynamic Placeholders**: Advanced date/time replacement in workflow inputs
- **Mobile-First Design**: Optimized touch interface and responsive design

### 🔧 **Advanced Configuration**
- Enhanced logging and debugging options
- Custom output directory management
- Flexible input/output path configuration
- Professional deployment settings

## Requirements

### For PC (Hosting WebUI):

-   **ComfyUI**: Version 0.3.45+ recommended (tested with latest builds)
-   **NodeJS**: Version 20.0.0 or higher
-   **Hardware**: Modern GPU recommended for optimal workflow performance
-   **RAM**: 16GB+ recommended for complex workflows

### Mobile (Accessing WebUI):

-   **Browser**: Modern browser with WebSocket support
-   **Network**: Same network as hosting PC (or properly configured remote access)

## Installation

### Prerequisites (For Complete Beginners)

If you're new to development tools, you'll need to install these first:

**📋 Required Tools:**
1. **Git** - Tool for downloading and managing code
   - **Windows**: [Git for Windows Installation Guide](https://github.com/git-guides/install-git#install-git-on-windows)
   - **macOS**: [Git for Mac Installation Guide](https://github.com/git-guides/install-git#install-git-on-macos)
   - **Alternative**: [Complete Beginner's Git Tutorial](https://www.atlassian.com/git/tutorials/install-git)

2. **Node.js & npm** - Runtime and package manager for the application
   - **Official Guide**: [Download Node.js](https://nodejs.org/en/download/) (includes npm automatically)
   - **Beginner Tutorial**: [How to Install Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
   - **Video Guide**: Search "How to install Node.js" on YouTube for visual guides

**✅ Quick Check**: After installation, open Command Prompt/Terminal and type:
```bash
git --version
node --version
npm --version
```
If all commands show version numbers, you're ready to proceed!

### Basic Installation
```bash
git clone https://github.com/jonoo407/ComfyUIMini-Redux-Floxy.git
cd ComfyUIMini-Redux-Floxy
npm install
npm run build
# Configure config/default.json with your paths
npm start
```

**💡 Need Help?** If you're completely new to command line:
- **Windows**: Search "Command Prompt" in Start Menu
- **macOS**: Press Cmd+Space, type "Terminal"
- **Copy and paste** each command one at a time
- Press Enter after each command and wait for it to complete

---

## Featured Custom Workflow: flux_floxy.json

**🚀 RTX 5090 Optimized - Highest quality FLUX image generation using bf16 weights, detail daemon, and face detailer with variable settings (can set to 0 to disable)**

*Note: This is a custom workflow included with this fork. The node packs and models listed below are only required if you want to use this specific workflow.*

### Required Node Packs (For This Workflow Only):

#### Core Node Packs:
```bash
# Install via ComfyUI Manager:

1. ComfyUI-KJNodes
   - Provides: DiffusionModelLoaderKJ (bf16 weight support)
   - URL: https://github.com/kijai/ComfyUI-KJNodes

2. ComfyUI-Impact-Pack  
   - Provides: FaceDetailer, BasicGuider, SamplerCustomAdvanced
   - URL: https://github.com/ltdrdata/ComfyUI-Impact-Pack

3. ComfyUI-Impact-Subpack
   - Provides: UltralyticsDetectorProvider, SAMLoader  
   - URL: https://github.com/ltdrdata/ComfyUI-Impact-Subpack

4. ComfyUI-Detail-Daemon
   - Provides: DetailDaemonSamplerNode (advanced detail enhancement)
   - URL: https://github.com/Jordach/comfyui-detail-daemon

5. WLSH Nodes
   - Provides: Empty Latent by Ratio (WLSH) (aspect ratio management)
   - URL: https://github.com/wallish77/wlsh_nodes
```

#### Installation via ComfyUI Manager:
1. Open ComfyUI → Manager → Install Custom Nodes
2. Search for each node pack name
3. Click Install and restart ComfyUI
4. Alternatively, install via URL using the "Install from Git URL" option

#### Required Models (For This Workflow):
- **FLUX Model**: Compatible FLUX model (bf16 format recommended for RTX 5090)
- **LoRA**: xlabs_realism_lora.safetensors or compatible realism LoRA
- **Face Detection**: bbox/face_yolov8n.pt (auto-downloaded with Impact-Subpack)
- **SAM Model**: sam_vit_b_01ec64.pth (auto-downloaded with Impact-Pack)

### Workflow Features:
- 🎯 **RTX 5090 Optimized**: Uses bf16 weight loading for maximum quality and VRAM efficiency on high-end hardware
- 🔍 **Detail Daemon Enhancement**: Advanced detail enhancement during generation (adjustable, set detail_amount to 0 to disable)
- 👤 **Professional Face Detailing**: Automatic face detection and enhancement with customizable settings
- 🎨 **Realism LoRA Integration**: Built-in support for realism enhancement LoRA
- 📐 **Flexible Aspect Ratios**: Smart aspect ratio management with portrait/landscape options
- ⚙️ **Variable Settings**: All enhancement features can be fine-tuned or disabled

### Quality Features:
- **BF16 Weight Loading**: Maximum model quality with efficient VRAM usage (ideal for 24GB+ VRAM)
- **Detail Daemon**: Adds fine details during generation process (0.0-1.0 range, 0 = disabled)
- **Face Enhancement**: Separate positive/negative prompts for face-specific improvements
- **Smart Sampling**: Uses beta scheduler with dpmpp_sde for optimal results
- **Professional Output**: Optimized for realistic, high-quality portrait generation

### Customization Options:
- **Detail Amount**: Adjust detail enhancement strength (0 = off, 0.3 = default, 1 = maximum)
- **Face Processing**: Can be bypassed by setting bbox_threshold to 0
- **Aspect Ratios**: Portrait/landscape with flexible sizing
- **LoRA Strength**: Adjustable realism enhancement (0-1 range)

This workflow represents a professional-grade setup for generating ultra-high quality realistic images with FLUX on RTX 5090 hardware, combining multiple enhancement techniques that can be individually controlled or disabled as needed.

---

## Usage

### Professional Workflow Management
- **Import**: Advanced drag & drop with auto-format detection
- **Edit**: Professional workflow editing with metadata preservation
- **Save**: Automatic saving with backup and version control
- **Export**: Clean workflow export without metadata pollution

### Enhanced Gallery Features
- **Professional Browse**: Navigate through complex project structures
- **Video Integration**: Full support for video generation workflows
- **Modal System**: Professional viewing experience with zoom and pan
- **Mobile Optimization**: Touch-optimized interface for mobile devices

### Advanced Queue Management
- **Real-time Monitoring**: Live queue status and detailed progress tracking
- **Mobile Refresh**: Pull-to-refresh functionality optimized for mobile
- **Automatic Updates**: Smart image detection and queue management

## Configuration

This fork includes enhanced configuration options. Copy `config/default.example.json` to `config/default.json` and update with your paths:

```json
{
    "app_port": 3000,
    "comfyui_url": "http://127.0.0.1:8188",
    "comfyui_ws_url": "ws://127.0.0.1:8188",
    "output_dir": "D:\\AI\\UIs\\SwarmUI_install\\SwarmUI\\Output\\local\\raw",
    "input_dir": "D:\\AI\\UIs\\ComfyUI_install\\ComfyUI\\input",
    "auto_convert_comfyui_workflows": true
}
```

**Important**: Update the `output_dir` and `input_dir` paths to match your ComfyUI installation.

## FAQ

### **Q**: How does this differ from the original ComfyUIMini?

**A**: This fork focuses on quality of life improvements, enhanced UI/UX design, better workflow management, and improved mobile experience. It includes custom enhancements for professional AI image generation workflows.

### **Q**: I can't import my workflow.

**A**: Save your workflow in API Format in ComfyUI (Settings → Enable "Save (API Format)"). This fork includes enhanced auto-conversion that handles most workflow formats automatically.

### **Q**: What quality of life improvements are included?

**A**: Enhanced workflow management, improved mobile interface, better video support, streamlined queue management, and various UI/UX improvements that make the experience more professional and efficient.

### **Q**: Can I suggest new features or improvements?

**A**: This is a personal fork focused on specific workflow needs. However, feedback is always welcome for potential future enhancements.

### **Q**: Do I need to install all those node packs?

**A**: No! The node packs listed are only required for the specific custom workflow (flux_floxy.json). ComfyUIMini-Redux-Floxy works with any ComfyUI setup and workflows.

## Credits & Support

### Original Projects
- **Original ComfyUIMini**: [ImDarkTom](https://github.com/ImDarkTom/ComfyUIMini) - Support the original creator: [Buy Me A Coffee](https://www.buymeacoffee.com/ImDarkTom)
- **ComfyUIMini-Redux**: [a1lazydog](https://github.com/a1lazydog/ComfyUIMini-Redux) - Support: [Buy Me A Coffee](https://www.buymeacoffee.com/bjew)

### This Fork
This fork is developed and maintained by **jonoo407** for professional AI image generation workflows.

**If you find this enhanced version useful for your projects, consider supporting continued development:**

<a href="https://coff.ee/kwude1bkpg" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>

### Development Focus
- Quality of life UI/UX improvements
- Professional image generation workflow optimization
- Enhanced mobile and PWA experience
- Advanced video generation support
- Custom workflow management features

---

**Repository**: Private development fork - focused on quality of life improvements and professional workflow enhancements.

**License**: AGPL-3.0 (inherited from original projects)
