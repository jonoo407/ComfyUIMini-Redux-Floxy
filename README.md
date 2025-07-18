# ComfyUI Mini

A mobile-friendly WebUI to run ComfyUI workflows.

![App Preview](https://github.com/user-attachments/assets/78a52443-ac9c-498c-8df3-129acd94a48c)

## Features

-   ⚡ Lightweight UI built for mobile devices
-   💾 Workflows saved to device or PC
-   ⏳ Progress info when generating images
-   🤖 Automatic workflow importing
-   🖼️ Gallery of all generated images & videos
-   📱 **PWA support** for standalone mobile app experience
-   🔄 **Queue** to track in progress generations

## Recent Improvements

### 🎥 **Gallery Enhancements**
- **Video Support**: Gallery now displays MP4 video files alongside images
- **Subfolder Navigation**: Improved navigation through nested gallery folders
- **Image Modal**: Enhanced modal system for viewing images and videos
- **Folder Traversal**: Navigate up and down through gallery subfolders

### 🔧 **Workflow Management**
- **Separate Metadata Files**: Workflow metadata is now stored in `.meta` files, preserving original JSON files
- **Supporting BOOLEAN in workflows**: Nodes with BOOLEANS can now be toggled

### ⚡ **Performance & UX**
- **Queue Management**: Images are automatically added to queue when generation completes
- **Date Replacement**: Dynamic date/time placeholders in workflow inputs

### 🔧 **Configuration Options**
- `hide_all_input_on_auto_covert`: Hide all inputs by default when auto-converting workflows
- `auto_convert_comfyui_workflows`: Enable/disable automatic workflow conversion
- Enhanced logging options for debugging

## Requirements

### For PC (Hosting WebUI):

-   **ComfyUI**: Ensure ComfyUI is installed and functional (minimum v0.2.2-50-7183fd1 / Sep. 18th release).
-   **NodeJS**: Version _20.0.0_ or higher.
-   **Package manager**: Preferably NPM as Yarn has not been explicitly tested but should work nonetheless.

### Mobile (Accessing WebUI):

-   **Browser**: Any modern browser with support for WebSocket.
-   **Network**: Connection to the same network as the hosting PC.

## Installation

You can find a guide to installing and running the app on the **[getting started](https://github.com/a1lazydog/ComfyUIMini/wiki/Getting-Started)** page.

## Usage

### Workflow Management
- **Import**: Drag and drop or select JSON workflow files
- **Edit**: Modify workflow titles, descriptions, and input configurations
- **Save**: Changes are automatically saved with sticky save buttons
- **Download**: Export clean workflow files without metadata

### Gallery Features
- **Browse**: Navigate through images and videos in the gallery
- **Subfolders**: Navigate into and out of subfolders
- **View**: Click images/videos to open in modal view
- **Refresh**: Pull down to refresh the queue on mobile

### Queue Management
- **Monitor**: Real-time queue status and progress
- **Refresh**: Pull-to-refresh functionality on mobile devices
- **Auto-update**: Images automatically appear in queue when completed

## FAQ

### **Q**: I can't import my workflow.

-   **A**: You need to save your workflow in API Format to be able to import it as regular saving doesn't provide enough information to list all available inputs. For a guide on how to enable this option see video [here](https://imgur.com/a/YsZQu83).

### **Q**: Can you access the WebUI outside of the local network?

-   **A**: Yes you can through the use of port forwarding, however this carries security risks as it will allow anyone to potentially connect to your WebUI. As the process of setting up port forwarding varies greatly depending on your internet service provider I am unable to give specific instructions, however you may be able to find help by searching '_[your ISP] enable port forwarding_'.

### **Q**: How do I use date replacement in workflow inputs?

-   **A**: In textarea inputs, you can use placeholders like `%date:YYYY-MM-DD%` to automatically insert the current date and time when the workflow runs.

### **Q**: What are .meta files?

-   **A**: `.meta` files contain ComfyUIMini-specific metadata (titles, descriptions, input configurations) separate from the original workflow JSON files. This preserves the original workflow files while maintaining the ComfyUIMini interface.

## Donating

This is a fork from the original author. If you find this WebUI to be useful and want to support him, you can <a href="https://www.buymeacoffee.com/ImDarkTom" target="_blank">donate to him</a>:

While this fork is mainly for myself, I appreciate any donations if you find this fork useful:

<a href="https://www.buymeacoffee.com/bjew" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>
