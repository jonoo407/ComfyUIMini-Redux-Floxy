# ComfyUIMini-Redux-Floxy Setup

This is a private fork of ComfyUIMini-Redux for personal modifications and enhancements.

## Configuration

Copy `config/default.example.json` to `config/default.json` and update the paths:

```json
{
    "app_port": 3000,
    "comfyui_url": "http://127.0.0.1:8188",
    "comfyui_ws_url": "ws://127.0.0.1:8188",
    "reject_unauthorised_cert": true,
    "optional_log": {
        "generation_finish": true,
        "queue_image": false,
        "fetch_queue": false,
        "fetch_history": false
    },
    "auto_convert_comfyui_workflows": true,
    "hide_all_input_on_auto_covert": false,
    "enable_gallery_delete": false,
    "output_dir": "D:/AI/UIs/ComfyUI_install/ComfyUI/output",
    "input_dir": "D:/AI/UIs/ComfyUI_install/ComfyUI/input",
    "developer": {
        "min_comfyui_version": "v0.2.2-50-7183fd1"
    }
}
```

## Current Workflow

The repository includes `flux_realism_dd_face_2.json` workflow ready for testing.

## Build & Run

```bash
npm install
npm run build
npm start
```

## Original Repository

Upstream: https://github.com/a1lazydog/ComfyUIMini-Redux

## Personal Modifications

- Custom configuration for local ComfyUI setup
- RTX 5090 optimization testing
- Workflow integration testing

---
Last Updated: July 26, 2025
