import { comfyUIAxios } from '../comfyUIAxios';
import FormData from 'form-data';

async function uploadMask(file: Express.Multer.File, originalRef: string, subfolder?: string) {
    try {
        const form = new FormData();
        form.append('image', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });
        form.append('original_ref', originalRef);
        
        if (subfolder) {
            form.append('subfolder', subfolder);
        }

        const response = await comfyUIAxios.post('/upload/mask', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        return response;
    } catch (error) {
        return { error: error };
    }
}

export default uploadMask; 