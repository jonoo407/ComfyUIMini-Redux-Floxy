# Configuration Guide

Complete guide for configuring ComfyUIMini-Redux-Floxy for various setups.

## Table of Contents
- [Basic Configuration](#basic-configuration)
- [Port Configuration](#port-configuration)
- [Remote Access Setup](#remote-access-setup)
- [Advanced Options](#advanced-options)
- [Performance Tuning](#performance-tuning)

## Basic Configuration

### Configuration File Location
The main configuration file is located at:
```
config/default.json
```

### Essential Settings

```json
{
    "app_port": 3000,
    "comfyui_url": "http://127.0.0.1:8188",
    "comfyui_ws_url": "ws://127.0.0.1:8188",
    "output_dir": "path/to/comfyui/output",
    "input_dir": "path/to/comfyui/input",
    "auto_convert_comfyui_workflows": true,
    "hide_all_input_on_auto_covert": false,
    "enable_gallery_delete": false
}
```

### Setting Descriptions

| Setting | Description | Default |
|---------|-------------|---------|
| `app_port` | Port for ComfyUIMini web interface | 3000 |
| `comfyui_url` | HTTP URL for ComfyUI API | http://127.0.0.1:8188 |
| `comfyui_ws_url` | WebSocket URL for ComfyUI | ws://127.0.0.1:8188 |
| `output_dir` | Where generated images are saved | ComfyUI/output |
| `input_dir` | Where input images are loaded from | ComfyUI/input |
| `auto_convert_comfyui_workflows` | Auto-convert workflow formats | true |
| `hide_all_input_on_auto_covert` | Hide inputs on auto-conversion | false |
| `enable_gallery_delete` | Allow image deletion from gallery | false |

## Port Configuration

### Finding Your ComfyUI Port

1. **Check ComfyUI Console:**
   ```
   Starting server on 127.0.0.1:8188
   ```

2. **Check Browser URL:**
   When accessing ComfyUI, note the port in the URL:
   ```
   http://localhost:8188
   ```

3. **Check Launch Script:**
   Look for `--port` parameter in your ComfyUI start script

### Common Port Scenarios

#### Default Setup
No changes needed if using standard ComfyUI:
```json
{
    "comfyui_url": "http://127.0.0.1:8188",
    "comfyui_ws_url": "ws://127.0.0.1:8188"
}
```

#### Custom Port
If ComfyUI uses port 8189:
```json
{
    "comfyui_url": "http://127.0.0.1:8189",
    "comfyui_ws_url": "ws://127.0.0.1:8189"
}
```

#### Docker Setup
For Docker containers:
```json
{
    "comfyui_url": "http://comfyui-container:8188",
    "comfyui_ws_url": "ws://comfyui-container:8188"
}
```

#### Remote ComfyUI
For ComfyUI on another machine:
```json
{
    "comfyui_url": "http://192.168.1.100:8188",
    "comfyui_ws_url": "ws://192.168.1.100:8188"
}
```

## Remote Access Setup

### Method 1: Local Network Access

Access from devices on the same network:

1. **Find Your PC's IP Address:**
   - Windows: `ipconfig` → Look for IPv4 Address
   - macOS/Linux: `ifconfig` or `ip addr`

2. **Update Configuration:**
   ```json
   {
       "app_port": 3000
   }
   ```

3. **Access from Mobile:**
   ```
   http://YOUR-PC-IP:3000
   ```

### Method 2: Tailscale (Recommended)

Secure access from anywhere without port forwarding.

#### Step 1: Install Tailscale

1. Sign up at [tailscale.com](https://tailscale.com)
2. Install on your host PC:
   - [Windows](https://tailscale.com/download/windows)
   - [macOS](https://tailscale.com/download/mac)
   - [Linux](https://tailscale.com/download/linux)
3. Install on mobile devices:
   - [iOS](https://apps.apple.com/us/app/tailscale/id1470499037)
   - [Android](https://play.google.com/store/apps/details?id=com.tailscale.ipn)

#### Step 2: Configure for Tailscale

1. **Get Your Tailscale IP:**
   ```bash
   tailscale ip -4
   ```
   Example result: `100.101.102.103`

2. **Update Configuration:**
   ```json
   {
       "comfyui_url": "http://100.101.102.103:8188",
       "comfyui_ws_url": "ws://100.101.102.103:8188"
   }
   ```

3. **Access Remotely:**
   ```
   http://100.101.102.103:3000
   ```

#### Tailscale Benefits
- ✅ End-to-end encryption
- ✅ No port forwarding needed
- ✅ Works behind firewalls
- ✅ Private network only
- ✅ Easy device management

### Method 3: Cloudflare Tunnel

For public access with protection:

1. Install cloudflared
2. Create tunnel:
   ```bash
   cloudflared tunnel create comfyui-mini
   ```
3. Configure and run:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

### Method 4: Reverse Proxy (Advanced)

Using Nginx:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Advanced Options

### Logging Configuration

```json
{
    "optional_log": {
        "generation_finish": true,
        "queue_image": false,
        "fetch_queue": false,
        "fetch_history": false,
        "performance_metrics": true
    }
}
```

### Gallery Settings

```json
{
    "gallery": {
        "images_per_page": 20,
        "enable_video_support": true,
        "supported_formats": ["jpg", "png", "webp", "mp4"],
        "thumbnail_size": 300,
        "enable_subfolders": true
    }
}
```

### Workflow Management

```json
{
    "workflows": {
        "auto_backup": true,
        "backup_count": 10,
        "compress_metadata": true,
        "default_workflow": "flux_floxy.json"
    }
}
```

## Performance Tuning

### Memory Optimization

For systems with limited RAM:
```json
{
    "performance": {
        "max_concurrent_generations": 1,
        "image_cache_size": 50,
        "workflow_cache_size": 20,
        "enable_compression": true
    }
}
```

### Network Optimization

For slow connections:
```json
{
    "network": {
        "request_timeout": 30000,
        "websocket_reconnect_interval": 5000,
        "max_reconnect_attempts": 10,
        "compression_level": 6
    }
}
```

### GPU Settings

RTX 5090 optimizations:
```json
{
    "gpu": {
        "prefer_bf16": true,
        "enable_flash_attention": true,
        "vram_reserved": 2048,
        "batch_size_multiplier": 2
    }
}
```

## Environment Variables

Override configuration with environment variables:

```bash
# Windows
set COMFYUI_URL=http://192.168.1.100:8188
set APP_PORT=3001

# Linux/macOS
export COMFYUI_URL=http://192.168.1.100:8188
export APP_PORT=3001
```

## Multiple Configurations

For different environments:

1. Create environment-specific configs:
   - `config/development.json`
   - `config/production.json`
   - `config/mobile.json`

2. Set NODE_ENV:
   ```bash
   NODE_ENV=production npm start
   ```

## Troubleshooting Configuration

### Connection Issues
1. Verify ComfyUI is running
2. Check firewall settings
3. Confirm ports are correct
4. Test with curl:
   ```bash
   curl http://127.0.0.1:8188/system_stats
   ```

### Path Issues
- Use absolute paths
- Escape backslashes on Windows: `C:\\path\\to\\folder`
- Ensure directories exist
- Check permissions

### Performance Issues
- Reduce concurrent generations
- Enable compression
- Increase timeouts for slow systems
- Monitor resource usage

---

[← Back to README](../README.md) | [Next: Features →](FEATURES.md)
