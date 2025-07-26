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
    console.log('⚠️  Please update the output_dir and input_dir paths in config/default.json to match your ComfyUI installation');
} else if (fs.existsSync(defaultPath)) {
    console.log('✓ config/default.json already exists');
}
