export type ImageType = 'input' | 'output' | 'temp';

export interface Image {
    filename: string;
    subfolder?: string;
    type: ImageType;
}

/**
 * Extracts subfolder and clean filename from a path
 * @param filepath The file path (e.g., "subfolder/filename.png" or "filename.png")
 * @returns Object with cleanFilename and subfolder
 */
function extractSubfolderInfo(filepath: string): { cleanFilename: string; subfolder: string } {
    if (!filepath) {
        return { cleanFilename: '', subfolder: '' };
    }
    
    const parts = filepath.split('/');
    if (parts.length > 1) {
        // For nested paths like "folder1/folder2/filename.png"
        // Extract everything except the last part as subfolder
        const subfolder = parts.slice(0, -1).join('/');
        const cleanFilename = parts[parts.length - 1];
        return { cleanFilename, subfolder };
    }
    
    return { cleanFilename: filepath, subfolder: '' };
}

/**
 * Constructs a ComfyUI image URL from an Image object
 * @param image The Image object containing filename, subfolder, and type
 * @returns The complete URL
 */
export function toComfyUIUrlFromImage(image: Image): string {
    const subfolderParam = image.subfolder ? `&subfolder=${image.subfolder}` : '';
    return `/comfyui/image?filename=${image.filename}${subfolderParam}&type=${image.type}`;
}

/**
 * Parses a ComfyUI image URL and returns an Image object
 * @param url The ComfyUI image URL (e.g., "/comfyui/image?filename=test.png&subfolder=loras&type=input")
 * @returns Object with filename, subfolder, and type properties
 */
export function toImageFromComfyUIUrl(url: string): Image {
    try {
        const urlObj = new URL(url, window.location.origin);
        const filename = urlObj.searchParams.get('filename') || '';
        const subfolder = urlObj.searchParams.get('subfolder') || undefined;
        const type = urlObj.searchParams.get('type') || 'input';
        
        return {
            filename,
            subfolder: subfolder || undefined,
            type: type as ImageType
        };
    } catch (_error) {
        // Fallback for relative URLs or malformed URLs
        const match = url.match(/\/comfyui\/image\?filename=([^&]+)(?:&subfolder=([^&]+))?(?:&type=([^&]+))?/);
        if (match) {
            return {
                filename: decodeURIComponent(match[1]),
                subfolder: match[2] ? decodeURIComponent(match[2]) : undefined,
                type: (match[3] || 'input') as ImageType
            };
        }
        
        // Return default values if parsing fails
        return {
            filename: '',
            type: 'input'
        };
    }
} 

/**
 * Parses a relative image URL and returns an Image object
 * Handles [output] and [input] suffixes at the end of filenames
 * @param relativeUrl The relative URL (e.g., "test.png", "subfolder/test.png", "test.png [output]")
 * @param defaultType The default type to use if no suffix is found (default: 'input')
 * @returns Object with filename, subfolder, and type properties
 */
export function toImageFromRelativeUrl(relativeUrl: string, defaultType: ImageType = 'input'): Image {
    if (!relativeUrl) {
        return { filename: '', type: defaultType };
    }
    
    // Handle [output] and [input] suffixes at the end
    let cleanUrl = relativeUrl;
    let detectedType = defaultType;
    
    if (relativeUrl.endsWith(' [output]')) {
        cleanUrl = relativeUrl.replace(' [output]', '');
        detectedType = 'output';
    } else if (relativeUrl.endsWith(' [input]')) {
        cleanUrl = relativeUrl.replace(' [input]', '');
        detectedType = 'input';
    }
    
    const { cleanFilename, subfolder } = extractSubfolderInfo(cleanUrl);
    
    return {
        filename: cleanFilename,
        subfolder: subfolder || undefined,
        type: detectedType as ImageType
    };
} 

/**
 * Converts an Image object to a relative URL string
 * @param image The Image object containing filename, subfolder, and type
 * @param includeType Whether to include the type suffix ([input] or [output]) at the end (default: false)
 * @returns The relative URL string
 */
export function toRelativeFromImage(image: Image, includeType: boolean = false): string {
    if (!image.filename) {
        return '';
    }
    
    let relativeUrl = image.filename;
    
    // Add subfolder prefix if it exists
    if (image.subfolder) {
        relativeUrl = `${image.subfolder}/${relativeUrl}`;
    }
    
    // Add type suffix if requested
    if (includeType) {
        relativeUrl += ` [${image.type}]`;
    }
    
    return relativeUrl;
} 