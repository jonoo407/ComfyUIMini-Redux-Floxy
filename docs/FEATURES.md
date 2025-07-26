# Features Documentation

Complete guide to all features in ComfyUIMini-Redux-Floxy.

## Table of Contents
- [Quality of Life Improvements](#quality-of-life-improvements)
- [Enhanced Capabilities](#enhanced-capabilities)
- [Mobile Features](#mobile-features)
- [Gallery Features](#gallery-features)
- [Workflow Management](#workflow-management)
- [Advanced Features](#advanced-features)

## Quality of Life Improvements

### 🗑️ Clear All Button

**Location:** Next to the "Run workflow" button

**Function:** Instantly clears all text input fields with one click

**Features:**
- Clears all prompts, text inputs, and multiline fields
- Auto-adjusts textarea heights after clearing
- Maintains other settings (seeds, steps, etc.)
- Visual feedback on click

**Usage:**
1. Fill out your workflow inputs
2. Click the trash icon (🗑️) to clear all text
3. All fields reset and ready for new input

### 💀 Individual Clear Buttons

**Location:** Skull icon next to each text input field

**Function:** Clear specific individual fields

**Features:**
- Animated skull icon on hover
- Scale and rotation effects
- Red glow on hover
- Auto-focus cleared field
- Works on all input types

**Animations:**
```css
/* Hover effect preview */
- Scale: 1.3x enlargement
- Rotation: 20° tilt
- Color: Red shadow glow
- Transition: 0.2s smooth
```

### 🎲 Extended Seed Randomizer

**Coverage:** Works on both `seed` and `noise_seed` inputs

**Components:**
1. **Dice Toggle (🎲/🔒)**
   - Click to enable/disable auto-randomization
   - 🎲 = Random on each run
   - 🔒 = Fixed seed value

2. **Manual Randomize (↻)**
   - Instant random value generation
   - Works regardless of toggle state
   - Generates cryptographically random values

**Features:**
- Remembers randomization preference
- Visual state indication
- Smooth toggle animation
- High-quality random numbers

### 🎨 Professional UI Integration

**Design Elements:**
- Flexbox layouts for responsive design
- Consistent spacing and alignment
- Smooth transitions (0.2s ease)
- Professional color scheme
- Mobile-optimized touch targets

**Button Layout:**
```
[Run workflow (70%)] [🗑️ Clear (30%)]
```

## Enhanced Capabilities

### 🎥 Video Support

**Supported Formats:**
- MP4 (H.264/H.265)
- WebM (future)
- MOV (future)

**Features:**
- Gallery video playback
- Thumbnail generation
- Progress tracking
- Full-screen viewing
- Mobile optimization

**Video Controls:**
- Play/Pause
- Seek bar
- Volume control
- Full-screen toggle
- Download option

### 📊 Advanced Queue Management

**Real-time Updates:**
- Live progress percentage
- Current/total step tracking
- Time remaining estimates
- Queue position indicator
- Batch progress tracking

**Queue Features:**
- Pause/Resume generation
- Queue reordering
- Priority settings
- Batch cancellation
- History tracking

### 🔄 Workflow Auto-Conversion

**Supported Formats:**
- ComfyUI API format
- ComfyUI UI format
- Legacy workflow JSONs
- Exported node graphs

**Conversion Features:**
- Automatic format detection
- Metadata preservation
- Backward compatibility
- Error recovery
- Validation checks

### 📝 Metadata Management

**Separate .meta Files:**
- Preserves original workflows
- Stores UI-specific settings
- Version tracking
- Change history
- Backup system

**Metadata Contents:**
```json
{
    "version": "1.7.0",
    "created": "2025-01-26",
    "modified": "2025-01-26",
    "ui_settings": {...},
    "custom_params": {...}
}
```

## Mobile Features

### 📱 Progressive Web App (PWA)

**Installation:**
1. Open in mobile browser
2. Click "Add to Home Screen"
3. Launches as standalone app

**PWA Features:**
- Offline workflow editing
- Push notifications
- Full-screen mode
- App icon and splash screen
- Background sync

### 🎯 Mobile-Optimized Interface

**Touch Optimizations:**
- Large touch targets (44px minimum)
- Swipe gestures
- Pull-to-refresh
- Pinch-to-zoom gallery
- Long-press context menus

**Responsive Design:**
- Breakpoints: 320px, 768px, 1024px
- Flexible grid layouts
- Collapsible sidebars
- Adaptive navigation
- Dynamic font sizing

### 📲 Mobile-Specific Features

**Hamburger Menu:**
- Top-left corner access
- Slide-out navigation
- Touch-optimized spacing
- Category organization
- Recent workflows

**Mobile Workflow:**
1. Home page grid view
2. Tap workflow card
3. Fill inputs (optimized keyboard)
4. Generate and view results
5. Save to device gallery

## Gallery Features

### 🖼️ Enhanced Gallery Browser

**Navigation:**
- Subfolder support
- Breadcrumb trail
- Quick navigation
- Search functionality
- Filter options

**View Modes:**
- Grid view (default)
- List view
- Slideshow mode
- Comparison mode
- Metadata view

### 🔍 Modal Viewing System

**Features:**
- Full-screen viewing
- Pinch-to-zoom
- Pan support
- EXIF data display
- Quick actions toolbar

**Keyboard Shortcuts:**
- `Arrow keys`: Navigate
- `Space`: Play/Pause video
- `F`: Full-screen
- `Esc`: Close modal
- `Delete`: Delete image

### 📁 Folder Management

**Capabilities:**
- Create folders
- Move images
- Batch operations
- Auto-organization
- Tag system

## Workflow Management

### 📥 Import System

**Drag & Drop:**
- Drop zones highlighted
- Format auto-detection
- Progress indication
- Error handling
- Batch import

**Import Sources:**
- Local files
- URL import
- Clipboard paste
- Gallery reuse
- Template library

### 💾 Save System

**Auto-Save:**
- Every 30 seconds
- Before generation
- On parameter change
- Version control
- Conflict resolution

**Manual Save:**
- Quick save (Ctrl+S)
- Save as new
- Export formats
- Cloud backup
- Share links

### 🔧 Workflow Editing

**Parameter Controls:**
- Slider inputs
- Number steppers
- Dropdown menus
- Color pickers
- File browsers

**Advanced Editing:**
- Node visibility
- Parameter grouping
- Conditional logic
- Preset system
- Macro recording

## Advanced Features

### ⚡ Performance Optimizations

**Caching:**
- Image cache (LRU)
- Workflow cache
- Model cache info
- Result prefetching
- Compressed storage

**Loading:**
- Lazy loading
- Progressive images
- Chunked transfers
- WebWorker processing
- GPU acceleration

### 🔐 Security Features

**Access Control:**
- Password protection
- API key system
- Rate limiting
- IP allowlisting
- Session management

**Data Protection:**
- Encrypted storage
- Secure connections
- Input sanitization
- CORS configuration
- XSS prevention

### 🛠️ Developer Features

**API Access:**
```javascript
// Example API usage
const api = new ComfyUIMiniAPI({
    url: 'http://localhost:3000',
    apiKey: 'your-api-key'
});

await api.runWorkflow('flux_floxy', {
    prompt: 'A beautiful landscape',
    seed: 12345
});
```

**Webhook Support:**
- Generation complete
- Error notifications
- Queue updates
- System events
- Custom triggers

### 📊 Analytics & Monitoring

**Metrics:**
- Generation times
- Success rates
- Popular workflows
- Resource usage
- Error tracking

**Dashboards:**
- Real-time stats
- Historical trends
- Performance graphs
- Usage heatmaps
- Alert system

## Feature Comparison

| Feature | Original | Redux | Redux-Floxy |
|---------|----------|-------|-------------|
| Mobile UI | ✅ | ✅ | ✅ Enhanced |
| Video Support | ❌ | ✅ | ✅ |
| Clear All | ❌ | ❌ | ✅ |
| Individual Clear | ❌ | ❌ | ✅ |
| Extended Randomizer | ❌ | ❌ | ✅ |
| Metadata Files | ❌ | ✅ | ✅ |
| PWA Support | ✅ | ✅ | ✅ Enhanced |
| Gallery Folders | ❌ | ✅ | ✅ |
| Auto-Convert | ✅ | ✅ | ✅ Enhanced |

---

[← Back to README](../README.md) | [Next: FAQ →](FAQ.md)
