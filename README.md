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

## ✨ Latest Quality of Life Improvements

### 🗑️ **Clear All Button**
- **Location**: Next to the "Run workflow" button
- **Function**: Instantly clears all text input fields (prompts) with one click
- **Smart Features**: Auto-adjusts textarea heights and focuses cleared fields

### 💀 **Individual Clear Buttons**
- **Location**: Skull icon (💀) next to each text input field
- **Function**: Clear specific individual fields for selective editing
- **Enhanced UX**: Smooth hover animations with scale, rotation, and glow effects
- **Focus Management**: Automatically focuses the cleared field for immediate typing

### 🎲 **Extended Seed Randomizer**
- **Enhanced Coverage**: Now works for both 'seed' AND 'noise_seed' inputs (was 'seed' only)
- **Dice Toggle**: Click the dice (🎲) to enable/disable auto-randomization on workflow run
- **Manual Randomize**: Refresh button (↻) for immediate randomization
- **Lock Mode**: Locked dice (🔒) indicates disabled auto-randomization

### 🎨 **Professional UI Integration**
- **Flexbox Layout**: Clean, properly aligned button arrangements
- **Consistent Styling**: All buttons match the professional design aesthetic
- **Responsive Design**: Optimized for both desktop and mobile interfaces
- **Smooth Transitions**: Enhanced hover effects and visual feedback

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

### 📋 Easy Desktop Shortcut

Create a desktop shortcut to start the application easily:

**Windows (.bat file):**
```batch
@echo off
cd /d "C:\path\to\your\ComfyUIMini-Redux-Floxy"
npm start
pause
```

**macOS/Linux (.sh file):**
```bash
#!/bin/bash
cd "/path/to/your/ComfyUIMini-Redux-Floxy"
npm start
```

**Instructions:**
1. Copy the appropriate code above
2. Save as `start-comfyuimini.bat` (Windows) or `start-comfyuimini.sh` (macOS/Linux)
3. Update the path to match your installation directory
4. Copy to your desktop
5. Double-click to start the application instantly!

---

## Configuration & Port Setup

### 🔌 ComfyUI Port Configuration

**Default Setup** (Most Users):
ComfyUI typically runs on port `8188`. If you're using the default setup, no changes needed.

**Custom Port Configuration**:
If your ComfyUI runs on a different port, update `config/default.json`:

```json
{
    "app_port": 3000,
    "comfyui_url": "http://127.0.0.1:XXXX",
    "comfyui_ws_url": "ws://127.0.0.1:XXXX",
    "output_dir": "path/to/your/comfyui/output",
    "input_dir": "path/to/your/comfyui/input"
}
```

**Common Port Scenarios:**
- **Default ComfyUI**: `8188` (no changes needed)
- **Custom ComfyUI Port**: Replace `8188` with your custom port
- **Docker ComfyUI**: Often uses `8188` but check your docker configuration
- **Remote ComfyUI**: Replace `127.0.0.1` with the IP address of the remote machine

**🔍 How to Find Your ComfyUI Port:**
1. Look at the ComfyUI startup message in console
2. Check your browser URL when accessing ComfyUI (e.g., `localhost:8188`)
3. If using custom launch scripts, check the `--port` parameter

### 🌐 Remote Access with Tailscale

Access your ComfyUIMini-Redux-Floxy from anywhere using Tailscale:

**Step 1: Install Tailscale**
1. Sign up at [Tailscale.com](https://tailscale.com)
2. Install Tailscale on both your host PC and mobile device
3. Log in with the same account on both devices

**Step 2: Configure for Remote Access**
```json
{
    "app_port": 3000,
    "comfyui_url": "http://YOUR-TAILSCALE-IP:8188",
    "comfyui_ws_url": "ws://YOUR-TAILSCALE-IP:8188",
    "output_dir": "path/to/your/comfyui/output",
    "input_dir": "path/to/your/comfyui/input"
}
```

**Step 3: Find Your Tailscale IP**
- **Windows**: Run `tailscale ip -4` in Command Prompt
- **macOS/Linux**: Run `tailscale ip -4` in Terminal
- **Alternative**: Check Tailscale admin console at [login.tailscale.com](https://login.tailscale.com)

**Step 4: Access Remotely**
- On your mobile device, navigate to: `http://YOUR-TAILSCALE-IP:3000`
- Bookmark for easy access!

**🔐 Security Benefits:**
- **Encrypted Connection**: All traffic encrypted end-to-end
- **No Port Forwarding**: No need to open ports on your router
- **Private Network**: Only your devices can access the application
- **Easy Management**: Add/remove devices through Tailscale admin console

**📱 Mobile PWA with Tailscale:**
- Add to home screen for app-like experience
- Works seamlessly over Tailscale connection
- Full offline workflow editing capabilities
- Automatic reconnection when network changes

### Enhanced Configuration

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

---

## 🎯 Featured Workflows & Models

This distribution includes **7 professional workflows** optimized for different AI image generation tasks. All workflows are fully functional with downloadable models and validated links.

### 🚀 **flux_floxy.json** - Premium RTX 5090 Optimized Workflow
**Flux with Detail Daemon, face detailer, bf16 workflow**

**🔥 RTX 5090 Optimized - Highest quality FLUX image generation using bf16 weights, detail daemon, and face detailer with variable settings (can set to 0 to disable)**

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

### 🖼️ **Kontext.json** - Intelligent Image Editing
**Basic flux Kontext taking one image input and editing it based on your text prompt**

Advanced FLUX Kontext workflow for precise image editing with text instructions. Perfect for modifying existing images while maintaining quality and coherence.

**Required Models:**
- **FLUX Kontext**: [FLUX.1-Kontext-dev](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev) (Official Black Forest Labs model)
- **CLIP Models**: [clip_l.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors) + [t5xxl_fp16.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors)

### 🔗 **kontext_chain.json** - Dual Image Style Transfer
**Takes two input images, processes them in a chain. Useful for applying styles and combining elements from both images. Requires some trial and error**

Advanced workflow for combining elements from multiple images using FLUX processing chain. Ideal for style transfer and image fusion projects.

**Required Models:**
- **FLUX Model**: FLUX_CRAFT_Fill_NSFW.safetensors (NSFW-capable FLUX variant)
- **CLIP Models**: [clip_l.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors) + [t5xxl_fp16.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors)

### 🧩 **kontext_stitch.json** - Image Composition
**Takes two input images, stitches them together for input to Flux Kontext. Refer to first image as image on left and second image as image on right. Use text prompt to describe what you want**

Professional image stitching workflow that combines two images before processing with FLUX Kontext for seamless composition results.

**Required Models:**
- **FLUX Kontext**: [FLUX.1-Kontext-dev](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev)
- **CLIP Models**: [clip_l.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors) + [t5xxl_fp16.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors)

### ⬆️ **SUPIR.json** - Professional Upscaling
**The best upscaler**

High-quality image upscaling workflow using SUPIR technology with SDXL Lightning for fast, professional results.

**Required Models:**
- **SDXL Model**: [Juggernaut XL v9RD Lightning](https://civitai.com/models/133005/juggernaut-xl) (Professional SDXL checkpoint)

### 🎨 **default_comfyui_workflow.json** - Classic Stable Diffusion
**Standard ComfyUI workflow for traditional image generation**

Basic workflow using SD1.5 for traditional image generation with reliable, tested results.

**Required Models:**
- **SD1.5 Model**: [Juggernaut Reborn](https://civitai.com/models/46422/juggernaut) (Realistic SD1.5 checkpoint)

### ⚡ **flux_simple_test.json** - FLUX Testing
**Simple FLUX test workflow for basic text-to-image generation**

Lightweight FLUX workflow for testing and simple image generation without advanced features.

**Required Models:**
- **FLUX Components**: [t5xxl_fp16.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors), [clip_l.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors), [ae.safetensors](https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/ae.safetensors)

---

## 📚 Model Download Links - All Validated ✅

### Core FLUX Models
- **FLUX.1-dev**: [Hugging Face - Official](https://huggingface.co/black-forest-labs/FLUX.1-dev)
- **FLUX Kontext**: [Hugging Face - Official](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev)
- **CLIP Models**: [ComfyUI Text Encoders Collection](https://huggingface.co/comfyanonymous/flux_text_encoders)

### LoRA Models
- **XLabs Realism LoRA**: [Hugging Face - Official](https://huggingface.co/XLabs-AI/flux-RealismLora/blob/main/lora.safetensors)
- **Civitai Alternative**: [XLabs Flux Realism LoRA](https://civitai.com/models/631986/xlabs-flux-realism-lora)

### Detection Models (Auto-Downloaded via ComfyUI Impact Pack)
- **Face Detection**: [bbox/face_yolov8n.pt](https://huggingface.co/Bingsu/adetailer) (via Impact Subpack)
- **SAM Segmentation**: [sam_vit_b_01ec64.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth) (Official Facebook Research)

### SDXL Models
- **Juggernaut XL**: [Civitai - Most Popular SDXL](https://civitai.com/models/133005/juggernaut-xl)
- **Juggernaut Reborn**: [Civitai - SD1.5 Version](https://civitai.com/models/46422/juggernaut)

### Installation Notes
- Most models auto-download through ComfyUI Manager when workflows are loaded
- Face detection models install automatically with Impact Subpack
- All download links validated and tested as of January 2025

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

### Quality of Life Features in Action

**🗑️ Clear All Workflow:**
1. Fill out your prompts and settings
2. Want to start fresh? Click the "🗑️ Clear" button next to "Run workflow"
3. All text fields instantly cleared and ready for new input

**💀 Individual Clear Workflow:**
1. Working with multiple prompts
2. Want to clear just one field? Click the skull (💀) next to that specific input
3. Field clears and automatically focuses for immediate typing

**🎲 Seed Randomization Workflow:**
1. Click dice (🎲) next to seed/noise_seed to enable auto-randomization
2. Each run will use a random seed automatically
3. Click again to lock (🔒) and use fixed seeds
4. Use refresh button (↻) for manual randomization anytime

## FAQ

### **Q**: How does this differ from the original ComfyUIMini?

**A**: This fork focuses on quality of life improvements, enhanced UI/UX design, better workflow management, and improved mobile experience. It includes custom enhancements for professional AI image generation workflows, plus the new Clear All, individual clear buttons, and extended seed randomizer features.

### **Q**: I can't import my workflow.

**A**: Save your workflow in API Format in ComfyUI (Settings → Enable "Save (API Format)"). This fork includes enhanced auto-conversion that handles most workflow formats automatically.

### **Q**: What quality of life improvements are included?

**A**: Enhanced workflow management, improved mobile interface, better video support, streamlined queue management, Clear All button, individual clear buttons (💀), extended seed randomizer for both seed and noise_seed, and various UI/UX improvements that make the experience more professional and efficient.

### **Q**: My ComfyUI runs on a different port, how do I configure it?

**A**: Update the `comfyui_url` and `comfyui_ws_url` in `config/default.json` to match your ComfyUI port. Replace `8188` with your custom port number.

### **Q**: Can I access this remotely from my phone?

**A**: Yes! Use Tailscale for secure remote access. Install Tailscale on both your host PC and mobile device, then update the configuration with your Tailscale IP address. See the Tailscale section above for detailed instructions.

### **Q**: Can I suggest new features or improvements?

**A**: This is a personal fork focused on specific workflow needs. However, feedback is always welcome for potential future enhancements.

### **Q**: Do I need to install all those node packs?

**A**: No! The node packs listed are only required for the specific custom workflow (flux_floxy.json). ComfyUIMini-Redux-Floxy works with any ComfyUI setup and workflows.

### **Q**: The clear buttons aren't working, what's wrong?

**A**: Make sure you've run `npm run build` after installation to compile the latest TypeScript changes. If issues persist, try refreshing your browser cache (Ctrl+F5 or Cmd+Shift+R).

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

---

**🌐 Professional AI Services**: [floxy.net](https://floxy.net)