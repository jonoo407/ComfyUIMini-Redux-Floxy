import express from 'express';
import multer from 'multer';
import { getHistory, getQueue, interruptGeneration, getImage, uploadImage, uploadMask } from '../utils/comfyAPIUtils';
import { getProcessedObjectInfo } from '../utils/objectInfoUtils';

const upload = multer();

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/history/:promptId', async (req, res) => {
    const promptId = req.params.promptId;

    if (!promptId) {
        res.send('Prompt id cannot be undefined').status(400);
    }

    const promptHistory = await getHistory(promptId);

    res.json(promptHistory);
});

router.get('/image', async (req, res): Promise<void> => {
    const queries = req.query;

    const filename = typeof queries.filename === 'string' ? queries.filename : null;
    const subfolder = typeof queries.subfolder === 'string' ? queries.subfolder : '';
    const imageType = typeof queries.type === 'string' ? queries.type : null;

    console.log('Image request:', { filename, subfolder, imageType });

    if (!filename || !imageType) {
        res.status(400).send('Missing parameters');
        return;
    }

    const imageResponse = await getImage(filename, subfolder, imageType);

    if (
        !imageResponse ||
        !imageResponse.headers['content-length'] ||
        !imageResponse.headers['content-type'] ||
        !(typeof imageResponse.headers['content-type'] === 'string') ||
        !(typeof imageResponse.headers['content-length'] === 'string')
    ) {
        res.status(500).send('Server error when fetching image. Check console for more information.');
        return;
    }

    res.set('Content-Type', imageResponse.headers['content-type']);
    res.set('Content-Length', imageResponse.headers['content-length']);
    res.send(imageResponse.data);
});

router.get('/queue', async (req, res) => {
    const queue = await getQueue();

    res.json(queue);
});

router.get('/interrupt', async (req, res) => {
    const interruptionResponse = await interruptGeneration();

    res.send(interruptionResponse.data);
});

router.get('/inputsinfo', async (req, res) => {
    const processedObjectInfo = await getProcessedObjectInfo();

    if (processedObjectInfo === null) {
        res.status(500).send('Could not get ComfyUI object info.');
        return;
    }

    res.json(processedObjectInfo);
});

router.post('/upload/image', upload.single('image'), async (req, res): Promise<void> => {
    try {
        if (
            !req.file ||
            !req.headers['content-type'] ||
            !req.headers['content-type'].startsWith('multipart/form-data')
        ) {
            res.status(400).json({ error: 'No file selected for upload' });
            return;
        }

        const subfolder = req.body.subfolder;
        const overwrite = req.body.overwrite === 'true';
        const response = await uploadImage(req.file, subfolder, overwrite);

        if ('error' in response) {
            res.status(500).json({ error: response.error });
            return;
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            externalResponse: response.data,
        });
    } catch (err) {
        console.error('Error uploading file to ComfyUI', err);
        res.status(500).json({ error: 'Failed to upload file.' });
    }
});

router.post('/upload/mask', upload.single('image'), async (req, res): Promise<void> => {
    try {
        if (
            !req.file ||
            !req.headers['content-type'] ||
            !req.headers['content-type'].startsWith('multipart/form-data')
        ) {
            res.status(400).json({ error: 'No mask file selected for upload' });
            return;
        }

        const originalRef = req.body.original_ref;
        const subfolder = req.body.subfolder;
        
        if (!originalRef) {
            res.status(400).json({ error: 'original_ref is required' });
            return;
        }

        const response = await uploadMask(req.file, originalRef, subfolder);

        if ('error' in response) {
            res.status(500).json({ error: response.error });
            return;
        }

        res.status(200).json({
            message: 'Mask uploaded successfully',
            externalResponse: response.data,
        });
    } catch (err) {
        console.error('Error uploading mask to ComfyUI', err);
        res.status(500).json({ error: 'Failed to upload mask.' });
    }
});

export default router;
