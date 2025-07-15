import { comfyUIAxios } from '../comfyUIAxios';
import fs from 'fs';
import path from 'path';
import config from 'config';

async function getImage(filename: string, subfolder: string, type: string) {
    const params = new URLSearchParams({ filename, subfolder, type });

    try {
        const response = await comfyUIAxios.get(`/view?${params.toString()}`, { responseType: 'arraybuffer' });

        return response;
    } catch (err: unknown) {
        if (err instanceof Error && 'code' in err) {
            if (err.code === 'ECONNREFUSED') {
                // Fallback if ComfyUI is unavailable
                const configKey = type === 'input' ? 'input_dir' : 'output_dir';
                const dirPath = config.get(configKey);
                
                if (!dirPath || typeof dirPath !== 'string') {
                    console.error(`${type === 'input' ? 'Input' : 'Output'} directory not configured`);
                    return null;
                }
                
                const readFile = fs.readFileSync(path.join(dirPath, subfolder, filename));
                
                // Determine content type based on file extension
                const ext = path.extname(filename).toLowerCase();
                let contentType = 'image/png'; // default
                
                if (['.jpg', '.jpeg'].includes(ext)) {
                    contentType = 'image/jpeg';
                } else if (['.png', '.ppm', '.bmp', '.pgm', '.tif', '.tiff', '.webp'].includes(ext)) {
                    contentType = 'image/png';
                } else if (['.mp4'].includes(ext)) {
                    contentType = 'video/mp4';
                }

                return {
                    data: readFile,
                    headers: {
                        'content-type': contentType,
                        'content-length': readFile.length,
                    },
                };
            }
        }

        console.error('Unknown error when fetching image:', err);
        return null;
    }
}

export default getImage;
