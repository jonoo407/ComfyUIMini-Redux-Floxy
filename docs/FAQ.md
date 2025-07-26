# Frequently Asked Questions (FAQ)

Common questions and troubleshooting for ComfyUIMini-Redux-Floxy.

## Table of Contents
- [General Questions](#general-questions)
- [Installation Issues](#installation-issues)
- [Workflow Problems](#workflow-problems)
- [Feature Questions](#feature-questions)
- [Performance Issues](#performance-issues)
- [Mobile & Remote Access](#mobile--remote-access)

## General Questions

### What makes this fork different?

This fork adds several quality of life improvements:
- **Clear All button** (🗑️) - One-click prompt clearing
- **Individual clear buttons** (💀) - Selective field clearing
- **Extended seed randomizer** - Works on all seed inputs
- **Enhanced UI/UX** - Professional styling and animations
- **Better documentation** - Comprehensive guides and validated model links

### Do I need all the node packs listed?

**No!** The node packs are only required for specific workflows:
- **flux_floxy.json** requires the listed node packs
- Other workflows work with standard ComfyUI
- ComfyUIMini-Redux-Floxy itself works with any ComfyUI setup

### Is this compatible with my existing workflows?

Yes! This fork maintains full compatibility:
- Imports any ComfyUI workflow format
- Auto-converts between formats
- Preserves all workflow settings
- Backward compatible with original ComfyUIMini

## Installation Issues

### I get "Cannot find module 'ejs'" error

The 'ejs' template engine didn't install properly. Fix it by running:
```bash
npm install ejs
```

This occasionally happens with npm installations. After installing ejs, try starting the application again.

### "npm: command not found"

Node.js is not installed or not in PATH:
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install using the installer
3. Restart your terminal/command prompt
4. Verify: `npm --version`

### "Cannot find module" errors

Dependencies not installed properly:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Build fails with TypeScript errors

Ensure you have the correct Node.js version:
```bash
node --version  # Should be 20.0.0 or higher
```

If issues persist:
```bash
npm install --save-dev typescript
npm run build
```

### Port 3000 already in use

Change the port in `config/default.json`:
```json
{
    "app_port": 3001
}
```

## Workflow Problems

### Can't import my workflow

1. **Save in API format** in ComfyUI:
   - Settings → Enable "Save (API Format)"
   - Save workflow again

2. **Check file format**:
   - Must be valid JSON
   - No trailing commas
   - Proper bracket matching

3. **Try auto-conversion**:
   - Drag and drop should auto-convert
   - Check console for errors

### Workflow runs but no output

Check your output directory configuration:
```json
{
    "output_dir": "C:\\path\\to\\ComfyUI\\output"
}
```

Ensure:
- Path exists and is writable
- Uses correct path separators
- Points to ComfyUI's actual output folder

### Images show as question marks

This means the image path is incorrect:
1. Verify `output_dir` in config matches ComfyUI's output
2. Ensure ComfyUI is saving to expected location
3. Check file permissions
4. Try absolute paths instead of relative

### Clear buttons not working

The clear buttons require a fresh build:
```bash
npm run build
```

Also clear browser cache:
- Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Firefox: Ctrl+F5
- Safari: Cmd+Option+R

## Feature Questions

### How do I enable video support?

Video support is enabled by default. Supported formats:
- MP4 (H.264/H.265)
- Generated videos appear in gallery
- Ensure your workflow outputs video format

### Can I delete images from the gallery?

Enable in configuration:
```json
{
    "enable_gallery_delete": true
}
```

**Warning:** This permanently deletes files!

### How do seed randomizers work?

**Dice Toggle (🎲/🔒):**
- 🎲 = New random seed each generation
- 🔒 = Use the fixed seed value
- Click to toggle between modes

**Manual Randomize (↻):**
- Generates random value immediately
- Works regardless of toggle state

### What's the metadata system?

Separate `.meta` files store:
- UI-specific settings
- Generation history
- Custom parameters
- Preserves original workflow JSON

## Performance Issues

### Slow generation times

This is usually ComfyUI-related, not ComfyUIMini:
1. Check ComfyUI console for errors
2. Monitor GPU usage: `nvidia-smi`
3. Reduce batch size or resolution
4. Ensure models are loaded to GPU

### Browser becomes unresponsive

Optimize settings:
```json
{
    "gallery": {
        "images_per_page": 10,
        "thumbnail_size": 200
    }
}
```

Clear cache periodically:
- Browser cache
- Image cache
- Old workflows

### High memory usage

For limited RAM:
```json
{
    "performance": {
        "max_concurrent_generations": 1,
        "image_cache_size": 20
    }
}
```

## Mobile & Remote Access

### Can't access from phone

1. **Same network access:**
   - Find PC IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Access: `http://YOUR-PC-IP:3000`
   - Ensure firewall allows port 3000

2. **Different network:**
   - Use Tailscale (recommended)
   - Or configure port forwarding
   - See [Configuration Guide](CONFIGURATION.md#remote-access-setup)

### Mobile interface issues

**PWA Installation:**
1. Open in mobile browser
2. Menu → "Add to Home Screen"
3. Opens as standalone app

**Touch not working:**
- Ensure using modern browser
- Clear browser cache
- Try different browser

### Tailscale connection fails

1. **Verify Tailscale is running** on both devices
2. **Check IP address:**
   ```bash
   tailscale ip -4
   ```
3. **Update config** with Tailscale IP:
   ```json
   {
       "comfyui_url": "http://100.x.x.x:8188"
   }
   ```

## Error Messages

### "Failed to connect to ComfyUI"

1. Ensure ComfyUI is running
2. Check URL in config:
   ```json
   {
       "comfyui_url": "http://127.0.0.1:8188"
   }
   ```
3. Try `localhost` instead of `127.0.0.1`
4. Check firewall settings

### "WebSocket connection failed"

WebSocket URL mismatch:
```json
{
    "comfyui_ws_url": "ws://127.0.0.1:8188"
}
```

Note: `ws://` not `wss://` for local connections

### "Invalid workflow format"

The workflow file is corrupted or invalid:
1. Validate JSON at [jsonlint.com](https://jsonlint.com)
2. Re-export from ComfyUI
3. Check for special characters
4. Ensure UTF-8 encoding

## Advanced Troubleshooting

### Enable debug logging

Add to configuration:
```json
{
    "debug": true,
    "optional_log": {
        "generation_finish": true,
        "queue_image": true,
        "fetch_queue": true,
        "fetch_history": true
    }
}
```

### Check browser console

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

### Test ComfyUI directly

Verify ComfyUI is working:
```bash
curl http://127.0.0.1:8188/system_stats
```

Should return JSON with system information.

## Getting Help

### Before asking for help:

1. Check this FAQ thoroughly
2. Read error messages carefully
3. Try a fresh installation
4. Test with a simple workflow first

### Information to provide:

- Node.js version: `node --version`
- Error messages from console
- Browser console errors (F12)
- Configuration file (remove sensitive data)
- Steps to reproduce issue

### Community Resources

- Original ComfyUIMini: [GitHub Issues](https://github.com/ImDarkTom/ComfyUIMini/issues)
- ComfyUI Discord: For ComfyUI-specific issues
- This fork: Feature requests via GitHub

---

[← Back to README](../README.md) | [Back to top ↑](#frequently-asked-questions-faq)
