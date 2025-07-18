import express from 'express';
import cookieParser from 'cookie-parser';
import themeMiddleware from '../middleware/themeMiddleware';
import {
    writeServerWorkflow,
    readServerWorkflow,
    serverWorkflowMetadata,
    deleteServerWorkflow,
    writeWorkflowMetadata,
    refreshWorkflowMetadataCache,
    updateAllWorkflowMetadata,
} from '../utils/workflowUtils';
import { getGalleryPageData } from '../utils/galleryUtils';
import { renderPage } from '../utils/renderUtils';
import { RequestWithTheme } from '@shared/types/Requests';
import loadAndRenderWorkflow from 'server/utils/loadAndRenderWorkflow';
import fs from 'fs';
import path from 'path';
import config from 'config';
import { Request, Response } from 'express';

const router = express.Router();

router.use(cookieParser());
router.use(themeMiddleware);
router.use(express.json());

router.get('/', (req: RequestWithTheme, res) => {
    const formattedWorkflowMetadata = Object.values(serverWorkflowMetadata)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((workflowMetadata) => ({
            ...workflowMetadata,
            type: 'server',
            icon: 'server',
        }));

    renderPage(req, res, 'pages/index', {
        serverWorkflowMetadata: formattedWorkflowMetadata
    });
});

router.get('/import', (req: RequestWithTheme, res) => {
    renderPage(req, res, 'pages/import');
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
        refreshWorkflowMetadataCache();
        res.status(200).send('Successfully saved edited workflow.');
    } else {
        res.status(500).send('Internal Server Error. Check logs for more info.');
    }
});

router.delete('/edit/:fileName', (req, res) => {
    const workflowFilename = req.params.fileName;

    const finishedSuccessfully = deleteServerWorkflow(workflowFilename);

    if (finishedSuccessfully) {
        refreshWorkflowMetadataCache();
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

router.get('/gallery/:type/*', (req: RequestWithTheme, res) => {
    const galleryType = req.params.type;
    const fullPath = req.params[0] || '';
    const subfolder = fullPath.split('?')[0];
    const page = Number(req.query.page) || 0;
    const itemsPerPage = Number(req.cookies[`${galleryType}ItemsPerPage`]) || 20;

    // Validate gallery type
    if (galleryType !== 'output' && galleryType !== 'input') {
        res.status(400).send('Invalid gallery type. Must be "output" or "input".');
        return;
    }

    const pageData = getGalleryPageData(page, subfolder, itemsPerPage, galleryType);

    renderPage(req, res, 'pages/gallery', {
        galleryType,
        enableDelete: config.get('enable_gallery_delete'),
        ...pageData
    });
});

// Legacy routes for backward compatibility
router.get('/gallery/*', (req: RequestWithTheme, res) => {
    // Redirect to output gallery
    const fullPath = req.params[0] || '';
    res.redirect(`/gallery/output/${fullPath}${req.url.includes('?') ? '&' + req.url.split('?')[1] : ''}`);
});

router.get('/input-images/*', (req: RequestWithTheme, res) => {
    // Redirect to input gallery
    const fullPath = req.params[0] || '';
    res.redirect(`/gallery/input/${fullPath}${req.url.includes('?') ? '&' + req.url.split('?')[1] : ''}`);
});

// API endpoint for unified gallery
router.get('/api/gallery/:type/*', (req: RequestWithTheme, res) => {
    const galleryType = req.params.type;
    const fullPath = req.params[0] || '';
    const subfolder = fullPath.split('?')[0];
    const page = Number(req.query.page) || 0;
    const itemsPerPage = Number(req.query.itemsPerPage) || 20;

    // Validate gallery type
    if (galleryType !== 'output' && galleryType !== 'input') {
        res.status(400).json({ error: 'Invalid gallery type. Must be "output" or "input".' });
        return;
    }

    const pageData = getGalleryPageData(page, subfolder, itemsPerPage, galleryType);

    if (pageData.error) {
        res.status(500).json({ error: pageData.error });
        return;
    }

    res.json(pageData);
});

function handleDeleteImage(req: Request, res: Response, dirKey: string, errorPrefix: string) {
    if (!config.get('enable_gallery_delete')) {
        res.status(403).json({ error: `${errorPrefix} delete is disabled` });
        return;
    }

    const { filename, subfolder } = req.body;

    if (!filename || typeof filename !== 'string') {
        res.status(400).json({ error: 'Filename is required' });
        return;
    }

    const dir = config.get(dirKey);
    if (!dir || typeof dir !== 'string') {
        res.status(500).json({ error: `${errorPrefix} directory not configured` });
        return;
    }

    const filePath = path.join(dir, subfolder || '', filename);

    // Security check: ensure the file is within the directory
    const resolvedFilePath = path.resolve(filePath);
    const resolvedDir = path.resolve(dir);

    if (!resolvedFilePath.startsWith(resolvedDir)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error(`Error deleting file:`, error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
}

router.delete('/gallery/:type/delete', (req, res) => {
    const galleryType = req.params.type;
    
    if (galleryType === 'output') {
        handleDeleteImage(req, res, 'output_dir', 'Gallery');
    } else if (galleryType === 'input') {
        handleDeleteImage(req, res, 'input_dir', 'Input images');
    } else {
        res.status(400).json({ error: 'Invalid gallery type' });
    }
});



router.get('/settings', (req: RequestWithTheme, res) => {
    renderPage(req, res, 'pages/settings');
});

router.get('/queue', (req: RequestWithTheme, res) => {
    renderPage(req, res, 'pages/queue');
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

router.get('/api/queue/completed/:workflowName', async (req, res) => {
    try {
        const { getCompletedItemsByWorkflowName } = await import('../utils/comfyAPIUtils/getQueue');
        const workflowName = decodeURIComponent(req.params.workflowName);
        const completedItems = await getCompletedItemsByWorkflowName(workflowName);
        res.json(completedItems);
    } catch (error) {
        console.error('Error fetching completed items for workflow:', error);
        res.status(500).json({ error: 'Failed to fetch completed items' });
    }
});

router.delete('/api/queue/completed', async (req, res) => {
    try {
        const { clearCompletedItems } = await import('../utils/comfyAPIUtils/getQueue');
        clearCompletedItems();
        res.json({ message: 'Completed items cleared successfully' });
    } catch (error) {
        console.error('Error clearing completed items:', error);
        res.status(500).json({ error: 'Failed to clear completed items' });
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

// Route to manually update metadata for all workflows
router.post('/api/workflows/update-metadata', async (req, res) => {
    try {
        const result = await updateAllWorkflowMetadata();
        
        // Refresh the metadata cache after updating
        refreshWorkflowMetadataCache();
        
        res.json({
            success: true,
            message: `Metadata update completed. Updated: ${result.updated.length}, Errors: ${result.errors.length}`,
            updated: result.updated,
            errors: result.errors
        });
    } catch (error) {
        console.error('Error updating workflow metadata:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update workflow metadata',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
