# Workflows & Models Documentation

This distribution includes **7 professional workflows** optimized for different AI image generation tasks.

## Table of Contents
- [Quick Overview](#quick-overview)
- [Workflow Details](#workflow-details)
- [Model Download Links](#model-download-links)
- [Installation Notes](#installation-notes)

## Quick Overview

| Workflow | Description | Key Feature |
|----------|-------------|-------------|
| **flux_floxy** | Premium RTX 5090 optimized | Detail Daemon + Face Detailer |
| **Kontext** | Intelligent image editing | Text-based modifications |
| **Kontext Chain** | Dual image processing | Style transfer & fusion |
| **Kontext Stitch** | Image composition | Seamless stitching |
| **SUPIR Floxy** | Professional upscaling | AI restoration |
| **default_comfyui** | Classic SD1.5 | Reliable baseline |
| **flux_simple_test** | Basic FLUX testing | Lightweight |

## Workflow Details

### 🚀 flux_floxy.json
**Premium RTX 5090 Optimized Workflow**

The flagship workflow of this distribution, designed for maximum quality on high-end hardware.

**Key Features:**
- 🎯 RTX 5090 optimized with bf16 weight loading
- 🔍 Detail Daemon enhancement (adjustable 0-1)
- 👤 Professional face detection and enhancement
- 🎨 Realism LoRA integration
- 📐 Smart aspect ratio management

**Required Node Packs:**
```
1. ComfyUI-KJNodes (bf16 support)
2. ComfyUI-Impact-Pack (face detailer)
3. ComfyUI-Impact-Subpack (detection models)
4. ComfyUI-Detail-Daemon (detail enhancement)
5. WLSH Nodes (aspect ratios)
```

**Required Models:**
- FLUX Model (bf16 format recommended)
- xlabs_realism_lora.safetensors
- Face detection: bbox/face_yolov8n.pt
- SAM: sam_vit_b_01ec64.pth

**Customization:**
- Detail Amount: 0 = disabled, 0.3 = default, 1 = maximum
- Face Processing: Set bbox_threshold to 0 to bypass
- LoRA Strength: 0-1 range for realism control

### 🖼️ Kontext.json
**Intelligent Image Editing**

Edit existing images using natural language instructions.

**Use Cases:**
- Change object colors
- Modify backgrounds
- Add/remove elements
- Style adjustments

**Required Models:**
- FLUX.1-Kontext-dev
- clip_l.safetensors
- t5xxl_fp16.safetensors

**Tips:**
- Be specific in text prompts
- Reference image areas clearly
- Works best with high-quality inputs

### 🔗 Kontext Chain.json
**Dual Image Style Transfer**

Process two images in sequence for advanced style transfer and fusion.

**Use Cases:**
- Apply artistic styles
- Combine image elements
- Create hybrid compositions
- Sequential processing

**Required Models:**
- FLUX_CRAFT_Fill_NSFW.safetensors
- Standard CLIP models

**Workflow:**
1. Load two input images
2. Set processing parameters
3. Describe desired combination
4. Adjust blend strength

### 🧩 Kontext Stitch.json
**Image Composition**

Professionally stitch multiple images before FLUX processing.

**Use Cases:**
- Panoramic compositions
- Before/after comparisons
- Multi-panel artwork
- Seamless merging

**Required Models:**
- FLUX.1-Kontext-dev
- Standard encoders

**Tips:**
- Reference "left image" and "right image" in prompts
- Ensure similar lighting in source images
- Use for creative compositions

### ⬆️ SUPIR Floxy.json
**Professional AI Upscaling**

State-of-the-art upscaling with restoration capabilities.

**Features:**
- Up to 8x upscaling
- Detail restoration
- Artifact removal
- Color correction
- Texture enhancement

**Required Models:**
- SUPIR_v0F_fp16.safetensors
- Juggernaut XL v9RD Lightning
- SUPIR node pack (via Manager)

**Quality Settings:**
- Conservative: 2-4x with high fidelity
- Balanced: 4-6x with enhancement
- Aggressive: 6-8x with restoration

### 🎨 default_comfyui_workflow.json
**Classic Stable Diffusion**

Reliable SD1.5 workflow for traditional generation.

**Use Cases:**
- Quick iterations
- Lower VRAM usage
- Classic style outputs
- Compatibility testing

**Required Model:**
- Juggernaut Reborn (SD1.5)

### ⚡ flux_simple_test.json
**Basic FLUX Testing**

Minimal workflow for testing and debugging.

**Use Cases:**
- Quick tests
- Debugging setups
- Learning FLUX
- Minimal resource usage

## Model Download Links

### Core FLUX Models
| Model | Source | Size | Auto-Install |
|-------|--------|------|--------------|
| FLUX.1-dev | [Hugging Face](https://huggingface.co/black-forest-labs/FLUX.1-dev) | ~24GB | ✅ Manager |
| FLUX.1-Kontext-dev | [Hugging Face](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev) | ~24GB | ✅ Manager |
| CLIP Models | [ComfyAnonymous](https://huggingface.co/comfyanonymous/flux_text_encoders) | ~5GB | ✅ Manager |

### LoRA Models
| Model | Source | Size | Purpose |
|-------|--------|------|---------|
| XLabs Realism | [Hugging Face](https://huggingface.co/XLabs-AI/flux-RealismLora/blob/main/lora.safetensors) | ~370MB | Photorealism |
| Alternative | [CivitAI](https://civitai.com/models/631986/xlabs-flux-realism-lora) | ~370MB | Backup source |

### Detection Models
| Model | Source | Size | Auto-Install |
|-------|--------|------|--------------|
| face_yolov8n | Impact Pack | ~6MB | ✅ Automatic |
| SAM ViT-B | Facebook Research | ~375MB | ✅ Automatic |

### SDXL/SD Models
| Model | Source | Size | Type |
|-------|--------|------|------|
| Juggernaut XL | [CivitAI](https://civitai.com/models/133005/juggernaut-xl) | ~7GB | SDXL |
| Juggernaut Reborn | [CivitAI](https://civitai.com/models/46422/juggernaut) | ~2GB | SD1.5 |

### Upscaling Models
| Model | Source | Size | Quality |
|-------|--------|------|---------|
| SUPIR v0F | [Hugging Face](https://huggingface.co/camenduru/SUPIR/resolve/main/SUPIR_v0F_fp16.safetensors) | ~6GB | Highest |

## Installation Notes

### Automatic Installation
Most models auto-download through ComfyUI Manager:
1. Load workflow in ComfyUI
2. Manager detects missing models
3. One-click install available

### Manual Installation
For models not in Manager:
1. Download from provided links
2. Place in appropriate ComfyUI folders:
   - Checkpoints → `models/checkpoints/`
   - LoRAs → `models/loras/`
   - VAE → `models/vae/`
   - CLIP → `models/clip/`

### Storage Requirements
- **Minimum**: 50GB for basic workflows
- **Recommended**: 100GB for all workflows
- **Optimal**: 150GB+ for multiple model variants

### VRAM Requirements
| Workflow | Minimum | Recommended | Optimal |
|----------|---------|-------------|---------|
| flux_floxy | 12GB | 16GB | 24GB |
| Kontext | 10GB | 12GB | 16GB |
| SUPIR | 8GB | 12GB | 16GB |
| SD1.5 | 4GB | 6GB | 8GB |

---

[← Back to README](../README.md) | [Next: Configuration →](CONFIGURATION.md)
