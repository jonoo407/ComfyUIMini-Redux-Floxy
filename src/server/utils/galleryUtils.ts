import path from 'path';
import fs from 'fs';
import config from 'config';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.ppm', '.bmp', '.pgm', '.tif', '.tiff', '.webp', '.mp4'];
const VIDEO_EXTENSIONS = ['.mp4'];

// Default error response
const createErrorResponse = (error: string, subfolder = '') => ({
    error,
    currentSubfolder: subfolder,
    parentSubfolder: subfolder ? path.dirname(subfolder) : null,
    scanned: { subfolders: [], images: [] },
    pageInfo: { prevPage: 0, currentPage: 0, nextPage: 0, totalPages: 0 },
});

function getRelativeTimeText(timestamp: number): string {
    const now = Date.now();
    const secondsPast = Math.floor((now - timestamp) / 1000);

    const timeUnits = [
        { seconds: 31536000, label: 'year' },
        { seconds: 2628000, label: 'month' },
        { seconds: 604800, label: 'week' },
        { seconds: 86400, label: 'day' },
        { seconds: 3600, label: 'hour' },
        { seconds: 60, label: 'minute' },
        { seconds: 1, label: 'second' }
    ];

    for (const unit of timeUnits) {
        if (secondsPast >= unit.seconds) {
            const value = Math.floor(secondsPast / unit.seconds);
            return `${value} ${unit.label}${value !== 1 ? '(s)' : ''} ago`;
        }
    }

    return 'just now';
}

function toComfyUIUrlFromImage({ filename, subfolder, type }: { filename: string; subfolder?: string; type: string }) {
    const subfolderParam = subfolder ? `&subfolder=${subfolder}` : '';
    return `/comfyui/image?filename=${filename}${subfolderParam}&type=${type}`;
}

/**
 * Gets a list of images at the page.
 *
 * Returns images in the range `(page * itemsPerPage)` to `(page * itemsPerPage) + itemsPerPage`
 * @param {number} page - Page number to retrieve.
 * @param {string} subfolder - Subfolder within gallery directory.
 * @param {number} itemsPerPage - Images sent per page.
 * @param {string} type - Type of images to retrieve ('input' or 'output').
 * @returns {GalleryPageData} - Object containing paginated images and additional page info.
 */
function getGalleryPageData(page = 0, subfolder = '', itemsPerPage = 20, type = 'output') {
    const configKey = type === 'input' ? 'input_dir' : 'output_dir';
    const dirType = type === 'input' ? 'Input' : 'Output';

    // Check if the configuration property exists
    if (!config.has(configKey)) {
        return createErrorResponse(`${dirType} directory not configured in config.`);
    }

    const imagePath = config.get(configKey);

    // Validate configuration
    if (!imagePath || typeof imagePath !== 'string') {
        return createErrorResponse(`${dirType} directory not set properly in config.`);
    }

    if (!fs.existsSync(imagePath)) {
        return createErrorResponse(`Invalid ${dirType.toLowerCase()} directory.`);
    }

    const targetPath = path.join(imagePath, subfolder);

    if (!fs.existsSync(targetPath)) {
        return createErrorResponse('Invalid subfolder path.', subfolder);
    }

    // Get all files and filter for supported extensions
    const files = fs.readdirSync(targetPath);
    const imageFiles = files.filter(file => 
        SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );

    // Process image files
    const processedFiles = imageFiles
        .map(file => {
            const ext = path.extname(file).toLowerCase();
            const filePath = path.join(targetPath, file);
            const stats = fs.statSync(filePath);
            
            return {
                path: toComfyUIUrlFromImage({ filename: file, subfolder, type }),
                filename: file,
                isVideo: VIDEO_EXTENSIONS.includes(ext),
                time: stats.mtime.getTime(),
                timeText: getRelativeTimeText(stats.mtime.getTime()),
            };
        })
        .sort((a, b) => b.time - a.time);

    // Pagination
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFiles = processedFiles.slice(startIndex, endIndex);

    // Get subfolders
    let subfolders: string[] = [];
    try {
        subfolders = files
            .filter(item => fs.statSync(path.join(targetPath, item)).isDirectory());
    } catch (error) {
        console.log('Error getting subfolders:', error);
    }

    // Calculate page info
    const totalPages = Math.max(0, Math.ceil(processedFiles.length / itemsPerPage) - 1);
    const prevPage = Math.max(0, page - 1);
    const nextPage = Math.min(totalPages, page + 1);

    return {
        currentSubfolder: subfolder,
        parentSubfolder: subfolder ? path.dirname(subfolder) : null,
        scanned: { subfolders, images: paginatedFiles },
        pageInfo: { prevPage, currentPage: page, nextPage, totalPages },
        error: null,
    };
}

export { getGalleryPageData };

export function getGallerySidebarData() {
    const outputDir = config.get('output_dir');
    const inputDir = config.get('input_dir');
    
    const hasOutputDir = outputDir && outputDir !== 'path/to/comfyui/output/folder';
    const hasInputDir = inputDir && inputDir !== 'path/to/comfyui/input/folder';
    const galleryDisabled = !hasOutputDir && !hasInputDir;
    
    return {
        hasOutputDir,
        hasInputDir,
        galleryDisabled
    };
}
