import { comfyUIAxios } from '../comfyUIAxios';
import FormData from 'form-data';

async function uploadImage(file: Express.Multer.File, subfolder?: string, overwrite?: boolean) {
    try {
        const form = new FormData();
        form.append('image', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });
        if (subfolder) {
            form.append('subfolder', subfolder);
        }
        if (overwrite) {
            form.append('overwrite', 'true');
        }

        const response = await comfyUIAxios.post('/upload/image', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        return response;
    } catch (error) {
        return { error: error };
    }
}

export default uploadImage;
