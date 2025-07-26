const fs = require('fs');
const path = require('path');

const configDir = path.join(__dirname, '..', 'config');
const defaultPath = path.join(configDir, 'default.json');
const examplePath = path.join(configDir, 'default.example.json');

// Only create default.json if it doesn't exist
if (!fs.existsSync(defaultPath) && fs.existsSync(examplePath)) {
    console.log('Creating default.json from example...');
    fs.copyFileSync(examplePath, defaultPath);
    console.log('✓ Created config/default.json');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Update these paths in config/default.json:');
    console.log('   - output_dir: Path to your ComfyUI output folder');
    console.log('   - input_dir: Path to your ComfyUI input folder');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
} else if (fs.existsSync(defaultPath)) {
    console.log('✓ config/default.json already exists');
}
