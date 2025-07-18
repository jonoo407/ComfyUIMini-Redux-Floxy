import { RequestWithTheme } from '@shared/types/Requests';
import { WorkflowType } from '@shared/types/Workflow';
import { Response } from 'express';
import { readServerWorkflow, readWorkflowMetadata } from './workflowUtils';
import { renderPage } from './renderUtils';

function loadAndRenderWorkflow(
    workflowType: WorkflowType,
    workflowIdentifier: string,
    req: RequestWithTheme,
    res: Response,
    page: string
) {
    if (workflowType === 'local') {
        renderPage(req, res, page, {
            workflowTitle: workflowIdentifier,
            workflowIdentifier: workflowIdentifier,
            workflowText: 'null',
            workflowType: 'local',
            workflowFilename: ''
        });
    } else {
        const workflowFileJson = readServerWorkflow(workflowIdentifier);

        if ('error' in workflowFileJson) {
            if (workflowFileJson.error === 'notFound') {
                res.status(404).send('Workflow not found.');
                return;
            } else if (workflowFileJson.error === 'invalidJson') {
                res.status(400).send('Invalid workflow file.');
                return;
            } else {
                res.status(500).send('Internal Server Error');
                return;
            }
        }

        // Get metadata from separate file
        const metadata = readWorkflowMetadata(workflowIdentifier);
        const workflowTitle = metadata?.title || workflowIdentifier;

        renderPage(req, res, page, {
            workflowTitle: workflowTitle,
            workflowIdentifier: workflowIdentifier,
            workflowText: JSON.stringify(workflowFileJson),
            workflowType: 'server',
            workflowFilename: workflowIdentifier
        });
    }
}

export default loadAndRenderWorkflow;
