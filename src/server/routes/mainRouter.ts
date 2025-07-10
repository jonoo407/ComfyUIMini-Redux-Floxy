import express from 'express';
import cookieParser from 'cookie-parser';
import themeMiddleware from '../middleware/themeMiddleware';
import {
    writeServerWorkflow,
    readServerWorkflow,
    serverWorkflowMetadata,
    deleteServerWorkflow,
    writeWorkflowMetadata,
} from '../utils/workflowUtils';
import { getGalleryPageData } from '../utils/galleryUtils';
import { RequestWithTheme } from '@shared/types/Requests';
import loadAndRenderWorkflow from 'server/utils/loadAndRenderWorkflow';

const router = express.Router();

router.use(cookieParser());
router.use(themeMiddleware);
router.use(express.json());

router.get('/', (req: RequestWithTheme, res) => {
    const formattedWorkflowMetadata = Object.values(serverWorkflowMetadata).map((workflowMetadata) => ({
        ...workflowMetadata,
        type: 'server',
        icon: 'server',
    }));

    res.render('pages/index', {
        serverWorkflowMetadata: formattedWorkflowMetadata,
        theme: req.theme,
    });
});

router.get('/import', (req: RequestWithTheme, res) => {
    res.render('pages/import', { theme: req.theme });
});

router.get('/edit/:type/:identifier', (req: RequestWithTheme, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    if (workflowType !== 'local' && workflowType !== 'server') {
        res.status(400).send('Invalid workflow type');
        return;
    }

    loadAndRenderWorkflow(workflowType, workflowIdentifier, req, res, 'pages/edit');
});

router.put('/edit/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;
    const requestBody = req.body;

    let workflowJson;
    let metadata;

    // Handle both old format (embedded metadata) and new format (separate metadata)
    if (requestBody.workflow && requestBody.metadata) {
        // New format: separate workflow and metadata
        workflowJson = requestBody.workflow;
        metadata = requestBody.metadata;
    } else {
        // Old format: embedded metadata (for backward compatibility)
        workflowJson = requestBody;
        metadata = requestBody._comfyuimini_meta;
    }

    // Save the workflow (without metadata)
    const workflowSaved = writeServerWorkflow(workflowFilename, workflowJson);
    
    // Save the metadata separately
    let metadataSaved = true;
    if (metadata) {
        metadataSaved = writeWorkflowMetadata(workflowFilename, metadata);
    }

    if (workflowSaved && metadataSaved) {
        res.status(200).send('Successfully saved edited workflow.');
    } else {
        res.status(500).send('Internal Server Error. Check logs for more info.');
    }
});

router.delete('/edit/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;

    const finishedSuccessfully = deleteServerWorkflow(workflowFilename);

    if (finishedSuccessfully) {
        res.status(200).send('Successfully deleted edited workflow.');
    } else {
        res.status(500).send('Internal Server Error. Check logs for more info.');
    }
});

router.get('/download/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;

    const workflowFile = readServerWorkflow(workflowFilename);

    if ('error' in workflowFile) {
        if (workflowFile.error === 'notFound') {
            res.status(404).send('Workflow not found.');
            return;
        } else if (workflowFile.error === 'invalidJson') {
            res.status(400).send('Invalid workflow file.');
            return;
        } else {
            res.status(500).send('Internal Server Error');
            return;
        }
    }

    // Extract the clean workflow without metadata
    const { _comfyuimini_meta, ...cleanWorkflow } = workflowFile;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${workflowFilename}"`);
    res.send(JSON.stringify(cleanWorkflow, null, 2));
});

router.get('/workflow/:type/:identifier', (req: RequestWithTheme, res) => {
    const workflowType = req.params.type;
    const workflowIdentifier = req.params.identifier;

    if (workflowType !== 'local' && workflowType !== 'server') {
        res.status(400).send('Invalid workflow type');
        return;
    }

    loadAndRenderWorkflow(workflowType, workflowIdentifier, req, res, 'pages/workflow');
});

router.get('/gallery/*', (req: RequestWithTheme, res) => {
    const fullPath = req.params[0] || '';
    const subfolder = fullPath.split('?')[0];
    const page = Number(req.query.page) || 0;
    const itemsPerPage = Number(req.cookies['galleryItemsPerPage']) || 20;

    const pageData = getGalleryPageData(page, subfolder, itemsPerPage);

    res.render('pages/gallery', { theme: req.theme, ...pageData });
});

router.get('/settings', (req: RequestWithTheme, res) => {
    res.render('pages/settings', { theme: req.theme });
});

router.get('/queue', (req: RequestWithTheme, res) => {
    res.render('pages/queue', { theme: req.theme });
});

router.get('/api/queue', async (req, res) => {
    try {
        const getQueue = (await import('../utils/comfyAPIUtils/getQueue')).default;
        const queueData = await getQueue();
        res.json(queueData);
    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({ error: 'Failed to fetch queue data' });
    }
});

router.get('/allserverworkflows', async (req, res) => {
    const infoList = Object.entries(serverWorkflowMetadata).map((workflowMetadata) => {
        return {
            title: workflowMetadata[1].title,
            icon: 'server',
            type: 'server',
            identifier: workflowMetadata[1].filename,
        };
    });

    res.json(infoList);
});

export default router;
