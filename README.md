# ComfyUIMini-Redux-Floxy

**Personal fork of ComfyUIMini-Redux optimized for RTX 5090 workflows and enhanced AI image generation**

A mobile-friendly PWA to run ComfyUI workflows with advanced features and optimizations.

![App Preview](https://github.com/user-attachments/assets/78a52443-ac9c-498c-8df3-129acd94a48c)

## About This Fork

This is a personal fork of [ComfyUIMini-Redux](https://github.com/a1lazydog/ComfyUIMini-Redux) focused on:
- 🚀 **RTX 5090 Optimization**: Enhanced performance for high-end GPU workflows
- 🎯 **Professional Workflows**: Optimized for realistic image generation and detail enhancement
- 🔧 **Custom Configurations**: Tailored settings for advanced AI pipelines
- 📱 **Enhanced Mobile Experience**: Improved PWA functionality and mobile optimization

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
- **RTX 5090 Optimized**: Custom configurations for high-end GPU performance
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
-   **GPU**: RTX 5090 recommended for optimal performance
-   **RAM**: 32GB+ recommended for complex workflows

### Mobile (Accessing WebUI):

-   **Browser**: Modern browser with WebSocket support
-   **Network**: Same network as hosting PC (or properly configured remote access)

## Installation

### Quick Start
See the **[Complete Installation Guide](SETUP_FLOXY.md)** for detailed step-by-step instructions.

### For Experienced Users
```bash
git clone https://github.com/jonoo407/ComfyUIMini-Redux-Floxy.git
cd ComfyUIMini-Redux-Floxy
npm install
npm run build
# Configure config/default.json with your paths
npm start
```

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

This fork includes enhanced configuration options:

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

See [SETUP_FLOXY.md](SETUP_FLOXY.md) for complete configuration details.

## FAQ

### **Q**: How does this differ from the original ComfyUIMini?

**A**: This fork focuses on professional workflows, RTX 5090 optimization, enhanced video support, and improved mobile experience. It includes custom configurations for advanced AI image generation pipelines.

### **Q**: I can't import my workflow.

**A**: Save your workflow in API Format in ComfyUI (Settings → Enable "Save (API Format)"). This fork includes enhanced auto-conversion that handles most workflow formats automatically.

### **Q**: Can I use this with other GPUs besides RTX 5090?

**A**: Absolutely! While optimized for RTX 5090, this fork works with any GPU that supports ComfyUI. The optimizations simply provide better performance on high-end hardware.

### **Q**: How do I update workflows?

**A**: Same process as standard ComfyUI - save in API format and the enhanced auto-detection will handle the rest. This fork provides better workflow management than the original.

## Credits & Support

### Original Projects
- **Original ComfyUIMini**: [ImDarkTom](https://github.com/ImDarkTom/ComfyUIMini) - Support the original creator: [Buy Me A Coffee](https://www.buymeacoffee.com/ImDarkTom)
- **ComfyUIMini-Redux**: [a1lazydog](https://github.com/a1lazydog/ComfyUIMini-Redux) - Support: [Buy Me A Coffee](https://www.buymeacoffee.com/bjew)

### This Fork
This fork is developed and maintained by **jonoo407** for professional AI image generation workflows.

**If you find this enhanced version useful for your projects, consider supporting continued development:**

<a href="https://coff.ee/kwude1bkpg" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>

### Development Focus
- RTX 5090 workflow optimization
- Professional image generation pipelines  
- Enhanced mobile and PWA experience
- Advanced video generation support
- Custom AI model integration

---

**Repository**: Private development fork - optimized for professional AI workflows and high-end GPU performance.

**License**: AGPL-3.0 (inherited from original projects)
