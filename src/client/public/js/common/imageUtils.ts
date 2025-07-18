/**
 * Extracts subfolder and clean filename from a path
 * @param filepath The file path (e.g., "subfolder/filename.png" or "filename.png")
 * @returns Object with cleanFilename and subfolder
 */
export function extractSubfolderInfo(filepath: string): { cleanFilename: string; subfolder: string } {
    if (!filepath) {
        return { cleanFilename: '', subfolder: '' };
    }
    
    const parts = filepath.split('/');
    if (parts.length > 1) {
        const subfolder = parts[0];
        const cleanFilename = parts.slice(1).join('/');
        return { cleanFilename, subfolder };
    }
    
    return { cleanFilename: filepath, subfolder: '' };
}

/**
 * Constructs a ComfyUI image URL with proper subfolder handling
 * @param filename The filename (with or without subfolder)
 * @param type The image type (default: 'input')
 * @returns The complete URL
 */
export function constructImageUrl(filename: string, type: string = 'input'): string {
    const { cleanFilename, subfolder } = extractSubfolderInfo(filename);
    const subfolderParam = subfolder ? `&subfolder=${subfolder}` : '';
    return `/comfyui/image?filename=${cleanFilename}${subfolderParam}&type=${type}`;
} 