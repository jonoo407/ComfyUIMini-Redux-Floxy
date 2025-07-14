import path from 'path';
import fs from 'fs';
import config from 'config';
import logger from './logger';
import paths from './paths';
import { Workflow, WorkflowFileReadError, WorkflowWithMetadata, WorkflowMetadata, InputOption } from '@shared/types/Workflow';
import { WorkflowInstance } from '@shared/classes/Workflow';

export interface ServerWorkflowMetadata {
    title: string;
    filename: string;
    description: string;
}

export type ServerWorkflowMetadataList = Record<string, ServerWorkflowMetadata>;

let fetchedWorkflowMetadata: ServerWorkflowMetadataList = {};

function serverWorkflowsCheck(): void {
    checkForWorkflowsFolder();

    const jsonFileList = getWorkflowFolderJsonFiles();
    const fetchedServerWorkflowMetadata = getServerWorkflowMetadata(jsonFileList);

    fetchedWorkflowMetadata = fetchedServerWorkflowMetadata;
}

/**
 * Checks if the server workflows folder path exists, if not, tries to creates it.
 */
function checkForWorkflowsFolder() {
    if (!fs.existsSync(paths.workflows)) {
        logger.warn(`Server workflows folder path from config not found, attempting to create...`);

        try {
            fs.mkdirSync(paths.workflows);
            logger.success(`Server workflows folder created at '${paths.workflows}'`);
        } catch (err) {
            console.error(`Error creating server workflows directory: ${err}`);
        }

        return;
    }

    return;
}

/**
 * Reads the server workflows folder for JSON files.
 *
 * @returns {string[]} An array of JSON filenames in the workflows folder.
 */
function getWorkflowFolderJsonFiles(): string[] {
    const filesList = fs.readdirSync(paths.workflows);
    const jsonFilesList = filesList.filter((file) => path.extname(file).toLowerCase() === '.json');

    return jsonFilesList;
}

/**
 * Checks if a JSON workflow object is a valid ComfyUI workflow.
 *
 * @param {object} workflowJson The workflow object.
 * @returns {boolean} True if workflow is a valid ComfyUI workflow, otherwise false.
 */
function checkIfObjectIsValidWorkflow(workflowJson: { [key: string]: any }): boolean {
    if (typeof workflowJson !== 'object') {
        return false;
    }

    for (const key of Object.keys(workflowJson)) {
        const node = workflowJson[key];

        if (node && typeof node === 'object' && 'inputs' in node && typeof node.inputs === 'object') {
            return true;
        }
    }

    return false;
}

/**
 * Gets the metadata filename for a given workflow filename.
 *
 * @param {string} workflowFilename The workflow filename.
 * @returns {string} The corresponding metadata filename.
 */
function getMetadataFilename(workflowFilename: string): string {
    const baseName = path.basename(workflowFilename, '.json');
    return `${baseName}.meta`;
}

/**
 * Reads metadata from a .meta file.
 *
 * @param {string} workflowFilename The workflow filename.
 * @returns {WorkflowMetadata | null} The metadata object or null if not found.
 */
function readWorkflowMetadata(workflowFilename: string): WorkflowMetadata | null {
    try {
        const metadataFilename = getMetadataFilename(workflowFilename);
        const metadataPath = path.join(paths.workflows, metadataFilename);
        
        if (!fs.existsSync(metadataPath)) {
            return null;
        }

        const metadataContents = fs.readFileSync(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContents);
        
        return metadata;
    } catch (error) {
        logger.error(`Error reading metadata for ${workflowFilename}: ${error}`);
        return null;
    }
}

/**
 * Writes metadata to a .meta file.
 *
 * @param {string} workflowFilename The workflow filename.
 * @param {WorkflowMetadata} metadata The metadata to write.
 * @returns {boolean} Whether the metadata was successfully written.
 */
function writeWorkflowMetadata(workflowFilename: string, metadata: WorkflowMetadata): boolean {
    try {
        const metadataFilename = getMetadataFilename(workflowFilename);
        const metadataPath = path.join(paths.workflows, metadataFilename);
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        return true;
    } catch (error) {
        logger.error(`Error writing metadata for ${workflowFilename}: ${error}`);
        return false;
    }
}

/**
 * Deletes a .meta file.
 *
 * @param {string} workflowFilename The workflow filename.
 * @returns {boolean} Whether the metadata file was successfully deleted.
 */
function deleteWorkflowMetadata(workflowFilename: string): boolean {
    try {
        const metadataFilename = getMetadataFilename(workflowFilename);
        const metadataPath = path.join(paths.workflows, metadataFilename);
        
        if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
        }
        return true;
    } catch (error) {
        logger.error(`Error deleting metadata for ${workflowFilename}: ${error}`);
        return false;
    }
}

/**
 * Checks if a workflow's metadata matches its current structure and updates it if needed.
 *
 * @param {Workflow} workflowObject The current workflow object.
 * @param {WorkflowMetadata} existingMetadata The existing metadata to check against.
 * @param {string} workflowFilename The filename of the workflow.
 * @returns {boolean} True if metadata was updated, false if it was already up to date.
 */
function checkAndUpdateWorkflowMetadata(
    workflowObject: Workflow,
    existingMetadata: WorkflowMetadata,
    workflowFilename: string
): boolean {
    // Create a set of current node-input combinations
    const currentInputs = new Set<string>();
    for (const [nodeId, node] of Object.entries(workflowObject)) {
        if (nodeId.startsWith('_')) {
            continue;
        }

        for (const [inputName, inputValue] of Object.entries(node.inputs)) {
            if (Array.isArray(inputValue)) {
                // Inputs that come from other nodes come as an array
                continue;
            }
            currentInputs.add(`${nodeId}-${inputName}`);
        }
    }

    // Create a set of existing metadata node-input combinations
    const existingInputs = new Set<string>();
    for (const inputOption of existingMetadata.input_options) {
        existingInputs.add(`${inputOption.node_id}-${inputOption.input_name_in_node}`);
    }

    // Check if there are any differences
    const hasNewInputs = [...currentInputs].some(input => !existingInputs.has(input));
    const hasRemovedInputs = [...existingInputs].some(input => !currentInputs.has(input));

    if (!hasNewInputs && !hasRemovedInputs) {
        // No changes detected
        return false;
    }

    logger.info(`Metadata mismatch detected for ${workflowFilename}. Updating metadata...`);

    // Generate new metadata while preserving existing settings
    const newMetadata = WorkflowInstance.generateMetadataForWorkflow(
        workflowObject,
        workflowFilename,
        config.get('hide_all_input_on_auto_covert')
    )._comfyuimini_meta;

    // Preserve existing metadata settings where possible
    const existingOptionsMap = new Map<string, InputOption>();
    for (const option of existingMetadata.input_options) {
        const key = `${option.node_id}-${option.input_name_in_node}`;
        existingOptionsMap.set(key, option);
    }

    // Update new metadata with existing settings
    for (const newOption of newMetadata.input_options) {
        const key = `${newOption.node_id}-${newOption.input_name_in_node}`;
        const existingOption = existingOptionsMap.get(key);
        
        if (existingOption) {
            // Preserve existing settings
            newOption.disabled = existingOption.disabled;
            newOption.title = existingOption.title;
            newOption.textfield_format = existingOption.textfield_format;
            newOption.numberfield_format = existingOption.numberfield_format;
            newOption.min = existingOption.min;
            newOption.max = existingOption.max;
        }
    }

    // Preserve title and description
    newMetadata.title = existingMetadata.title;
    newMetadata.description = existingMetadata.description;

    // Write the updated metadata
    if (writeWorkflowMetadata(workflowFilename, newMetadata)) {
        logger.info(`Successfully updated metadata for ${workflowFilename}`);
        return true;
    } else {
        logger.error(`Failed to update metadata for ${workflowFilename}`);
        return false;
    }
}

/**
 * Attempts to get text metadata for all workflows in the server workflows folder.
 *
 * @param {string[]} jsonFileList List of JSON files in the workflows folder.
 * @returns {ServerWorkflowMetadataList} An object containing the metadata for each workflow.
 */
function getServerWorkflowMetadata(jsonFileList: string[]): ServerWorkflowMetadataList {
    const accumulatedWorkflowMetadata: ServerWorkflowMetadataList = {};

    for (const jsonFilename of jsonFileList) {
        const jsonFileContents = fs.readFileSync(path.join(paths.workflows, jsonFilename), 'utf8');
        const parsedJsonContents = JSON.parse(jsonFileContents);

        if (!checkIfObjectIsValidWorkflow(parsedJsonContents)) {
            continue;
        }

        // Check for embedded metadata first (for backward compatibility)
        const embeddedMetadata = parsedJsonContents['_comfyuimini_meta'];
        
        if (embeddedMetadata) {
            // If embedded metadata exists, migrate it to .meta file
            if (writeWorkflowMetadata(jsonFilename, embeddedMetadata)) {
                logger.info(`Migrated embedded metadata to .meta file for ${jsonFilename}`);
                
                // Remove the embedded metadata from the original JSON file
                const { _comfyuimini_meta, ...cleanWorkflow } = parsedJsonContents;
                try {
                    fs.writeFileSync(
                        path.join(paths.workflows, jsonFilename),
                        JSON.stringify(cleanWorkflow, null, 2),
                        'utf8'
                    );
                    logger.info(`Cleaned embedded metadata from ${jsonFilename}`);
                } catch (error) {
                    logger.error(`Error cleaning embedded metadata from ${jsonFilename}: ${error}`);
                }
            }
        }

        // Read metadata from .meta file
        const metadata = readWorkflowMetadata(jsonFilename);

        if (!metadata) {
            try {
                generateWorkflowMetadataAndSaveToFile(parsedJsonContents, jsonFilename);
            } catch (error) {
                console.log(`Error when auto-generating metadata for workflow '${jsonFilename}': ${error}`);
                continue;
            }

            // Read the newly created metadata
            const newMetadata = readWorkflowMetadata(jsonFilename);
            if (newMetadata) {
                accumulatedWorkflowMetadata[jsonFilename] = {
                    title: newMetadata.title,
                    filename: jsonFilename,
                    description: newMetadata.description,
                };
            } else {
                accumulatedWorkflowMetadata[jsonFilename] = {
                    title: jsonFilename,
                    filename: jsonFilename,
                    description: 'A ComfyUI workflow.',
                };
            }

            continue;
        }

        // Check if metadata needs to be updated due to workflow structure changes
        checkAndUpdateWorkflowMetadata(parsedJsonContents, metadata, jsonFilename);

        accumulatedWorkflowMetadata[jsonFilename] = {
            title: metadata.title,
            filename: jsonFilename,
            description: metadata.description,
        };
    }

    logger.info(`Found ${Object.keys(accumulatedWorkflowMetadata).length} valid workflows in the workflow folder.`);

    return accumulatedWorkflowMetadata;
}

/**
 * Auto-generates metadata for a workflow object and saves it to a .meta file.
 *
 * @param {Workflow} workflowObjectWithoutMetadata The workflow object without metadata.
 * @param {string} workflowFilename The filename of the workflow in the workflows folder.
 */
function generateWorkflowMetadataAndSaveToFile(workflowObjectWithoutMetadata: Workflow, workflowFilename: string) {
    if (config.get('auto_convert_comfyui_workflows') === false) {
        return;
    }

    const validateErrorMessage = WorkflowInstance.validateWorkflowObject(workflowObjectWithoutMetadata, true);
    if (validateErrorMessage) {
        logger.warn(`${workflowFilename} was not recognized as a valid ComfyUI workflow: ${validateErrorMessage}`);
    }

    const metadata = WorkflowInstance.generateMetadataForWorkflow(
        workflowObjectWithoutMetadata,
        workflowFilename,
        config.get('hide_all_input_on_auto_covert')
    )._comfyuimini_meta;

    try {
        if (writeWorkflowMetadata(workflowFilename, metadata)) {
            logger.info(
                `Created auto-generated ComfyUIMini metadata for '${workflowFilename}', to disable this feature you can disable 'auto_convert_comfyui_workflows' in config.`
            );
        }
    } catch (error) {
        logger.error(`Error when saving metadata to file: ${error}`);
        return;
    }
}

/**
 *
 * @param {string} filename The server workflow filename.
 * @returns {Record<string, object>|WorkflowFileReadError} The workflow object, or an object with an error type if there was an error.
 */
function readServerWorkflow(filename: string): WorkflowWithMetadata | WorkflowFileReadError {
    try {
        const workflowFilePath = path.join(paths.workflows, filename);
        const fileContents = fs.readFileSync(workflowFilePath);
        const workflowObject = JSON.parse(fileContents.toString());

        // Read metadata from .meta file
        const metadata = readWorkflowMetadata(filename);
        
        if (metadata) {
            // Combine workflow with metadata
            return {
                ...workflowObject,
                _comfyuimini_meta: metadata,
            } as WorkflowWithMetadata;
        } else {
            // Return workflow without metadata (for backward compatibility)
            return workflowObject;
        }
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            console.error('Error when reading workflow from file:', error);
            return { error: 'invalidJson' };
        } else if (error instanceof Error) {
            if ('code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                return { error: 'notFound' };
            }

            console.error('Error when reading workflow from file:', error);
            return { error: 'unknown' };
        } else {
            console.error('Unknown error when reading workflow from file:', error);
            return { error: 'unknown' };
        }
    }
}

/**
 * Saves a workflow object into a file in the server workflows folder.
 *
 * @param {string} filename The filename to save the workflow to.
 * @param {object} workflowObject The workflow object to convert into a JSON and save.
 * @returns {boolean} Whether or not the workflow was successfully saved.
 */
function writeServerWorkflow(filename: string, workflowObject: object): boolean {
    try {
        const workflowWithMetadata = workflowObject as WorkflowWithMetadata;
        
        // Extract metadata if it exists
        if (workflowWithMetadata._comfyuimini_meta) {
            const metadata = workflowWithMetadata._comfyuimini_meta;
            const { _comfyuimini_meta, ...workflowWithoutMetadata } = workflowWithMetadata;
            
            // Save the clean workflow
            fs.writeFileSync(path.join(paths.workflows, filename), JSON.stringify(workflowWithoutMetadata, null, 2), 'utf8');
            
            // Save the metadata to a .meta file
            return writeWorkflowMetadata(filename, metadata);
        } else {
            // Save workflow without metadata
            fs.writeFileSync(path.join(paths.workflows, filename), JSON.stringify(workflowObject, null, 2), 'utf8');
            return true;
        }
    } catch (error) {
        console.error('Error when saving workflow to file:', error);
        return false;
    }
}

function deleteServerWorkflow(filename: string): boolean {
    try {
        fs.unlinkSync(path.join(paths.workflows, filename));
        // Also delete the corresponding .meta file
        deleteWorkflowMetadata(filename);
        return true;
    } catch (error) {
        console.error('Error when deleting workflow from file:', error);
        return false;
    }
}

/**
 * Refreshes the workflow metadata cache by re-reading all workflow files.
 * This should be called after workflows are modified to keep the cache in sync.
 */
function refreshWorkflowMetadataCache(): void {
    serverWorkflowsCheck();
}

/**
 * Manually updates metadata for all workflows in the workflows folder.
 * This function checks each workflow's JSON file against its .meta file and updates
 * the metadata if there are structural changes (new nodes, removed nodes, etc.).
 * 
 * @returns {Promise<{updated: string[], errors: string[]}>} Object containing lists of updated and error files.
 */
export async function updateAllWorkflowMetadata(): Promise<{updated: string[], errors: string[]}> {
    const updated: string[] = [];
    const errors: string[] = [];

    try {
        checkForWorkflowsFolder();
        const jsonFileList = getWorkflowFolderJsonFiles();

        for (const jsonFilename of jsonFileList) {
            try {
                const jsonFileContents = fs.readFileSync(path.join(paths.workflows, jsonFilename), 'utf8');
                const parsedJsonContents = JSON.parse(jsonFileContents);

                if (!checkIfObjectIsValidWorkflow(parsedJsonContents)) {
                    errors.push(`${jsonFilename}: Invalid workflow format`);
                    continue;
                }

                const metadata = readWorkflowMetadata(jsonFilename);
                
                if (!metadata) {
                    // No metadata file exists, generate new one
                    try {
                        generateWorkflowMetadataAndSaveToFile(parsedJsonContents, jsonFilename);
                        updated.push(`${jsonFilename}: Created new metadata`);
                    } catch (error) {
                        errors.push(`${jsonFilename}: Failed to create metadata - ${error}`);
                    }
                } else {
                    // Check if metadata needs updating
                    const wasUpdated = checkAndUpdateWorkflowMetadata(parsedJsonContents, metadata, jsonFilename);
                    if (wasUpdated) {
                        updated.push(`${jsonFilename}: Updated metadata`);
                    }
                }
            } catch (error) {
                errors.push(`${jsonFilename}: ${error}`);
            }
        }

        logger.info(`Metadata update completed. Updated: ${updated.length}, Errors: ${errors.length}`);
    } catch (error) {
        logger.error(`Error during metadata update: ${error}`);
        errors.push(`General error: ${error}`);
    }

    return { updated, errors };
}

export {
    serverWorkflowsCheck,
    readServerWorkflow,
    writeServerWorkflow,
    deleteServerWorkflow,
    readWorkflowMetadata,
    writeWorkflowMetadata,
    deleteWorkflowMetadata,
    refreshWorkflowMetadataCache,
    fetchedWorkflowMetadata as serverWorkflowMetadata,
};
