// --- Imports ---
// External dependencies
import {
    FinishGenerationMessage,
    NodeExecutingMessage,
    NodeExecutedMessage,
    PreviewMessage,
    ProgressMessage,
    WorkflowStructureMessage,
} from '@shared/types/WebSocket.js';
import { WorkflowWithMetadata } from '@shared/types/Workflow.js';
import { NodeInputValues } from '@shared/types/SavedInputs.js';
import { WorkflowInstance } from '@shared/classes/Workflow.js';

// Internal modules
import { getLocalWorkflow } from '../modules/getLocalWorkflow.js';
import { renderInputs } from '../modules/workflowInputRenderer.js';
import { SaveInputValues } from '../modules/savedInputValues.js';
import { openPopupWindow, PopupWindowType } from '../common/popupWindow.js';
import { showResolutionSelector } from '../modules/resolutionSelector.js';
import { ProgressBarManager } from '../modules/progressBar.js';
import { fetchMediaForCompletedItem, createSingleMediaItemHtml, addMediaClickHandlers, createMediaItemsHtml } from '../common/mediaDisplay.js';
import { formatDate } from '../common/formatString.js';
import { WebSocketManager } from '../common/websocket.js';

// --- DOM Elements ---
const elements = {
    inputsContainer: document.querySelector('.inputs-container') as HTMLElement,
    outputImagesContainer: document.querySelector('.output-images-container') as HTMLElement,
    runButton: document.querySelector('.run-workflow') as HTMLButtonElement,
    cancelRunButton: document.querySelector('.cancel-run-button') as HTMLButtonElement,
    get allFileInputs() {
        return document.querySelectorAll('.workflow-input-container .file-input') as NodeListOf<HTMLElement>;
    },
    get allSelectsWithImageUploads() {
        return document.querySelectorAll('select.workflow-input.has-image-upload') as NodeListOf<HTMLSelectElement>;
    },
    get allWorkflowInputContainers() {
        return document.querySelectorAll('.workflow-input-container') as NodeListOf<HTMLElement>;
    },
    previousOutputsToggler: document.querySelector('.previous-outputs-toggler') as HTMLElement,
    previousOutputsList: document.querySelector('.previous-outputs-list') as HTMLElement,
    previousOutputsTogglerIcon: document.querySelectorAll('.previous-outputs-toggler-icon') as NodeListOf<HTMLElement>,
    get allResolutionSelectors() {
        return document.querySelectorAll('.resolution-selector-container') as NodeListOf<HTMLElement>;
    },
};

// --- Progress Bar Manager ---
const progressBarManager = new ProgressBarManager();

// --- Variables ---
let previousOutputsLoaded = false;
let isWorkflowRunning = false;

// Create wsManager as a const, with empty handlers initially
const wsManager = new WebSocketManager({});

// @ts-expect-error - passedWorkflowIdentifier is fetched via the inline script supplied by EJS
const workflowIdentifier = passedWorkflowIdentifier;
// @ts-expect-error - passedWorkflowType is fetched via the inline script supplied by EJS
const workflowType = passedWorkflowType;

// Workflow data from EJS via inline script tag
// @ts-expect-error - workflowDataFromEjs is fetched via the inline script supplied by EJS
const workflowObject: WorkflowWithMetadata = workflowDataFromEjs ? workflowDataFromEjs : fetchLocalWorkflow();

// --- WebSocket Management ---

// Initialize the page
loadWorkflow();

// Enhanced cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Keep workflows running when leaving the page
    // Only clean up UI resources
    progressBarManager.cleanup();
    wsManager.destroy();
});

async function loadWorkflow() {
    try {
        await renderInputs(workflowObject, workflowType, workflowIdentifier);
        startEventListeners();
        // Set handlers and connect
        await wsManager.setHandlers({
            onMessage: handleWebSocketMessage,
            onClose: (event: CloseEvent) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                if (isWorkflowRunning) {
                    console.warn('WebSocket closed during workflow execution');
                    // The next attempt to send a message will trigger reconnection
                }
            }
        }).connect();
    } catch (error) {
        console.warn('Failed to establish initial WebSocket connection:', error);
        // Don't show error popup for initial connection failure
        // Connection will be attempted when user tries to run workflow
    }
}

/**
 * Fetches the current local workflow from localStorage.
 * If the workflow is not found, an error is thrown.
 *
 * @returns The workflow object
 */
function fetchLocalWorkflow(): WorkflowWithMetadata {
    const localWorkflow = getLocalWorkflow(workflowIdentifier);

    if (!localWorkflow) {
        const errorMessage = `Workflow '${workflowIdentifier}' not found.`;
        openPopupWindow(errorMessage, PopupWindowType.ERROR);
        throw new Error(errorMessage);
    }

    return localWorkflow;
}

/**
 * Starts the event listeners for the various elements on the page.
 */
function startEventListeners() {
    elements.runButton.addEventListener('click', runWorkflow);
    elements.cancelRunButton.addEventListener('click', cancelRun);

    elements.inputsContainer.addEventListener('click', handleInputContainerClick);

    elements.allFileInputs.forEach((element) => fileUploadEventListener(element));
    elements.allSelectsWithImageUploads.forEach((selectElement) => imageSelectEventListener(selectElement));

    elements.previousOutputsToggler.addEventListener('click', togglePreviousOutputs);

    elements.allResolutionSelectors.forEach((resolutionSelector) =>
        resolutionSelectorEventListener(resolutionSelector)
    );

    // Initialize auto-expand textareas
    initializeAutoExpandTextareas();
}

function resolutionSelectorEventListener(resolutionSelector: HTMLElement) {
    resolutionSelector.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        if (!target.classList.contains('resolution-selector-button') && !target.classList.contains('icon')) {
            return;
        }

        let targetParent = target.parentNode;
        if (target.classList.contains('icon')) {
            targetParent = targetParent?.parentNode || null;
        }

        if (!targetParent) {
            console.error('No parent node found');
            return;
        }

        showResolutionSelector((targetParent as HTMLElement).getAttribute('data-node-id') as string);
    });
}

function togglePreviousOutputs() {
    const previousOutputsList = elements.previousOutputsList;

    if (previousOutputsList.classList.contains('hidden')) {
        elements.previousOutputsTogglerIcon.forEach((icon) => icon.classList.add('open'));
        expandElement(previousOutputsList);
        
        // Load previous outputs from API if not already loaded
        if (!previousOutputsLoaded) {
            loadPreviousOutputsFromAPI();
        }
    } else {
        elements.previousOutputsTogglerIcon.forEach((icon) => icon.classList.remove('open'));
        collapseElement(previousOutputsList);
    }
}

/**
 * Collapses an element, element has to have a style for the hidden class variant.
 * @param element The element to collapse.
 */
function collapseElement(element: HTMLElement) {
    element.style.height = `${element.scrollHeight}px`;

    element.classList.add('collapsing');

    requestAnimationFrame(() => {
        element.style.height = '0';
    });

    element.addEventListener('transitionend', function handler() {
        element.classList.add('hidden');
        element.classList.remove('collapsing');

        element.removeEventListener('transitionend', handler);
    });
}

function expandElement(element: HTMLElement) {
    element.classList.add('expanding');
    element.classList.remove('hidden');

    requestAnimationFrame(() => {
        element.style.height = `${element.scrollHeight}px`;
        element.style.opacity = '1';
        element.style.paddingTop = '0.5rem';
        element.style.paddingBottom = '0.5rem';
    });

    element.addEventListener('transitionend', function handler() {
        element.classList.remove('expanding');

        element.removeAttribute('style');
        element.style.height = `auto`;

        element.removeEventListener('transitionend', handler);
    });
}

/**
 * Handles updating the preview for a image select element.
 *
 * @param selectElement The select element to listen to.
 */
function imageSelectEventListener(selectElement: HTMLSelectElement) {
    selectElement.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLSelectElement;

        const selectedOption = target.options[target.selectedIndex];
        const selectedValue = selectedOption.value;

        if (!selectedValue) {
            return;
        }

        const innerInputWrapperElem = target.closest('.inner-input-wrapper');

        if (!innerInputWrapperElem) {
            return;
        }

        const imagePreviewElem = innerInputWrapperElem.querySelector('.input-image-preview') as HTMLImageElement;
        imagePreviewElem.src = `/comfyui/image?filename=${selectedValue}&subfolder=&type=input`;
    });
}

/**
 * Handles uploading an image file to the server for image select inputs.
 *
 * @param inputElement The file input element to listen to.
 */
function fileUploadEventListener(inputElement: HTMLElement) {
    inputElement.addEventListener('change', async (e) => {
        const target = e.target;

        if (!target || !(target instanceof HTMLInputElement)) {
            return;
        }

        if (!target.files) {
            return;
        }

        if (target.files.length > 0) {
            const file = target.files[0];

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/comfyui/upload/image', {
                    method: 'POST',
                    body: formData,
                });

                const responseJson = await response.json();

                if (responseJson.error) {
                    console.error(responseJson.error);
                }

                const selectId = inputElement.getAttribute('data-select-id');

                if (!selectId) {
                    console.error('No linked select attribute found');
                    return;
                }

                const linkedSelect = document.getElementById(selectId);

                if (!linkedSelect) {
                    console.error('Linked select not found');
                    return;
                }

                addOptionToSelect(linkedSelect as HTMLSelectElement, responseJson.externalResponse.name);
            } catch (err) {
                console.error(err);
            }
        }
    });
}

/**
 * Adds a new select option to a select element.
 * Used to add new images to existing selects when a new image is uploaded for image inputs.
 *
 * @param selectElem The select to add the option to.
 * @param option The option to add.
 */
function addOptionToSelect(selectElem: HTMLSelectElement, option: string) {
    const optionElem = document.createElement('option');
    optionElem.value = option;
    optionElem.textContent = option;

    selectElem.appendChild(optionElem);
}

/**
 * Handles clicks on elements inside the input container.
 *
 * @param event The click mouse event.
 * @returns Nothing.
 */
function handleInputContainerClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.classList.contains('randomise-input-toggle')) {
        toggleRandomiseInput(target);
    } else if (target.classList.contains('randomise-now-button')) {
        const parentNode = target.parentNode;

        if (!parentNode) {
            console.error('No parent node found');
            return;
        }

        const linkedInputId = (parentNode as HTMLElement).getAttribute('data-linked-input-id');

        if (!linkedInputId) {
            console.error('No linked input id found');
            return;
        }

        randomiseInput(linkedInputId);
    }
}

/**
 * Toggles on/off the randomisation of an input on workflow run.
 *
 * @param toggleElement The toggle element that was clicked.
 */
function toggleRandomiseInput(toggleElement: HTMLElement) {
    const toggleElemContainer = toggleElement.parentNode as HTMLElement;

    const randomiseOff = toggleElemContainer.classList.contains('randomise-off');

    if (randomiseOff) {
        toggleElemContainer.classList.remove('randomise-off');
    } else {
        toggleElemContainer.classList.add('randomise-off');
    }
}

/**
 * Randomises an input field.
 *
 * @param inputId The input to randomise.
 * @returns Nothing.
 */
function randomiseInput(inputId: string) {
    const input = document.getElementById(inputId);

    if (!input) {
        console.error('Input not found');
        return;
    }

    const min = input.getAttribute('min');
    const max = input.getAttribute('max');
    const step = input.getAttribute('step') || '1';

    let randomNumber;
    if (min && max && max > min) {
        randomNumber = generateRandomNum(parseFloat(min), parseFloat(max), parseFloat(step));
    } else {
        randomNumber = generateSeed();
    }

    (input as HTMLInputElement).value = randomNumber.toString();
}

/**
 * Generates a random number between min and max with a step.
 *
 * @param min The minimum value.
 * @param max The maximum value.
 * @param step The step size i.e. the difference between each number.
 * @returns The random number generated.
 */
function generateRandomNum(min: number, max: number, step: number): number {
    const range = (max - min) / step;
    return Math.min(min + step * Math.floor(Math.random() * range), max);
}

/**
 * Generates a random number seed.
 *
 * @returns A random seed.
 */
function generateSeed() {
    return Math.floor(Math.random() * 1e16)
        .toString()
        .padStart(16, '0');
}



function generateNodeInputValues(): NodeInputValues {
    const collectingInputValues: NodeInputValues = {};

    elements.allWorkflowInputContainers.forEach((inputContainer) => {
        const randomiseButtonsContainer = inputContainer.querySelector('.randomise-buttons-container');

        if (randomiseButtonsContainer) {
            handleInputRandomise(randomiseButtonsContainer);
        }

        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;

        const [, nodeId, nodeInputName] = inputElem.id.split('-');

        // For textarea elements, save the original template string but use formatted date for execution
        const originalValue = inputElem.value;
        const inputValue = (inputElem instanceof HTMLTextAreaElement) ? formatDate(originalValue) : originalValue;

        if (!collectingInputValues[nodeId]) {
            collectingInputValues[nodeId] = {};
        }

        collectingInputValues[nodeId][nodeInputName] = inputValue;
        
        // Save the original template string to localStorage
        SaveInputValues.fromNodeInputValues(workflowType, workflowIdentifier, {
            [nodeId]: { [nodeInputName]: originalValue }
        });
    });

    return collectingInputValues;
}

function handleInputRandomise(randomiseButtonContainer: Element) {
    if (randomiseButtonContainer.classList.contains('randomise-off')) {
        return;
    }

    const randomisedInputId = randomiseButtonContainer.getAttribute('data-linked-input-id');

    if (!randomisedInputId) {
        console.error('No linked input id found');
        return;
    }

    randomiseInput(randomisedInputId);
}

export async function runWorkflow() {
    // Set running state for proper cleanup
    isWorkflowRunning = true;
    
    // Reset progress bar
    progressBarManager.reset();

    const filledNodeInputValues = generateNodeInputValues();

    const filledWorkflow = new WorkflowInstance(workflowObject).fillWorkflowWithUserInputs(filledNodeInputValues);
    
    // Send both workflow and workflow name
    const message = {
        workflow: filledWorkflow,
        workflowName: workflowObject._comfyuimini_meta?.title || workflowIdentifier
    };
    
    try {
        // Send message (send() will ensure connection)
        await wsManager.send(message);
        elements.cancelRunButton.classList.remove('disabled');
        
    } catch (error) {
        console.error('Failed to send workflow:', error);
        isWorkflowRunning = false;
        progressBarManager.reset();
        
        // Provide more specific error message based on the error type
        let errorMessage = 'Failed to start workflow execution';
        if (error instanceof Error) {
            if (error.message.includes('WebSocket connection timeout')) {
                errorMessage = 'Connection timeout. Please check your network connection and try again.';
            } else if (error.message.includes('Failed to establish WebSocket connection')) {
                errorMessage = 'Unable to connect to the server. Please check if the server is running and try again.';
            } else {
                errorMessage = error.message;
            }
        }
        
        openPopupWindow(errorMessage, PopupWindowType.ERROR);
    }
}

// TODO: Setup type for message for both client and server
function handleWebSocketMessage(event: MessageEvent<any>) {
    try {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'workflow_structure':
                handleWorkflowStructure(message.data);
                break;

            case 'progress':
                updateProgressBars(message.data);
                break;

            case 'preview':
                updateImagePreview(message.data);
                break;

            case 'node_executing':
                handleNodeExecuting(message.data);
                break;

            case 'node_executed':
                handleNodeExecuted(message.data);
                break;

            case 'completed':
                finishGeneration(message.data);
                break;

            case 'error':
                // Enhanced error handling with workflow state management
                console.error('WebSocket Error:', message.message);
                isWorkflowRunning = false;
                progressBarManager.reset();
                elements.cancelRunButton.classList.add('disabled');
                openPopupWindow(message.message, PopupWindowType.ERROR);
                break;

            default:
                console.warn('Unknown WebSocket message type:', message.type);
                break;
        }
    } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
    }
}



function handleWorkflowStructure(messageData: WorkflowStructureMessage) {
    // Initialize progress bar with server-validated workflow structure
    const { totalNodes, workflow } = messageData;
    
    // Use the server's workflow structure for dependency analysis and display names
    // This is the exact workflow that the server is processing
    progressBarManager.initializeWithStructureData(totalNodes, workflow);
}

function updateProgressBars(messageData: ProgressMessage) {
    // Enhanced progress update with structure-aware calculations
    progressBarManager.updateProgressBars(messageData);
}

function updateImagePreview(messageData: PreviewMessage) {
    const currentSkeletonLoaderElem =
        elements.outputImagesContainer.querySelectorAll('.image-placeholder-skeleton')[0];

    if (!currentSkeletonLoaderElem) {
        return;
    }

    let previewImageElem: HTMLImageElement = currentSkeletonLoaderElem.querySelector('.preview') as HTMLImageElement;
    if (!previewImageElem) {
        previewImageElem = document.createElement('img');
        previewImageElem.classList.add('preview');
        previewImageElem.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        // Empty image to ensure no flicker between when element is loaded and src is set

        currentSkeletonLoaderElem.appendChild(previewImageElem);
    }

    previewImageElem.src = `data:${messageData.mimetype};base64,${messageData.image}`;
}

function handleNodeExecuting(messageData: NodeExecutingMessage) {
    // Update the current node label in the progress bar
    progressBarManager.setCurrentNode(messageData.node);
}

function handleNodeExecuted(messageData: NodeExecutedMessage) {
    // Mark the node as completed in the progress bar
    progressBarManager.markNodeCompleted(messageData.node);
}



async function loadPreviousOutputsFromAPI() {
    try {
        const workflowName = workflowObject._comfyuimini_meta?.title || workflowIdentifier;
        const encodedWorkflowName = encodeURIComponent(workflowName);
        
        const response = await fetch(`/api/queue/completed/${encodedWorkflowName}`);
        if (!response.ok) {
            throw new Error('Failed to fetch previous outputs');
        }
        
        const completedItems = await response.json();
        
        // Clear existing content
        elements.previousOutputsList.innerHTML = '';
        
        // Load images for each completed item
        for (const item of completedItems) {
            await loadImagesForCompletedItem(item);
        }
        
        // Add click handlers for images in previous outputs with "Use as Input" enabled
        addMediaClickHandlers('.previous-outputs-list', {
            enableUseAsInput: true,
            imageSelector: '.previous-output-img'
        });
        
        previousOutputsLoaded = true;
    } catch (error) {
        console.error('Error loading previous outputs:', error);
        elements.previousOutputsList.innerHTML = '<div class="error-message">Failed to load previous outputs</div>';
    }
}

async function loadImagesForCompletedItem(item: any) {
    try {
        const promptId = item[1];
        if (!promptId) return;
        
        // Use shared utility to fetch and extract media items
        const mediaItems = await fetchMediaForCompletedItem(promptId);
        
        // Add each media item to the previous outputs list with "Use as Input" enabled
        mediaItems.forEach((mediaItem) => {
            const mediaHtml = createSingleMediaItemHtml(mediaItem, {
                enableUseAsInput: true,
                itemClass: 'image-item', // unified class for overlay logic
                imgClass: 'previous-output-img'
            });
            elements.previousOutputsList.innerHTML = mediaHtml + elements.previousOutputsList.innerHTML;
        });
    } catch (error) {
        console.error('Error loading images for completed item:', error);
    }
}



function finishGeneration(messageData: FinishGenerationMessage) {
    // Mark workflow as no longer running
    isWorkflowRunning = false;
    
    // Complete progress bar with optimized final update
    progressBarManager.complete();
    
    elements.cancelRunButton.classList.add('disabled');

    // Extract all image URLs from the message data
    // messageData is Record<string, string[]> where keys are node IDs and values are arrays of image URLs
    const allMedia: { url: string; isVideo: boolean; filename: string; subfolder: string; type: string }[] = [];
    Object.values(messageData).forEach((mediaUrlArray) => {
        if (Array.isArray(mediaUrlArray)) {
            mediaUrlArray.forEach((url) => {
                // Guess type by extension (could be improved if type info is available)
                const isVideo = url.match(/\.(mp4|webm|ogg)(\?|$)/i) !== null;
                // Parse filename, subfolder, and type from the query string
                let filename = url;
                let subfolder = '';
                let type = '';
                try {
                    const urlObj = new URL(url, window.location.origin);
                    filename = urlObj.searchParams.get('filename') || '';
                    subfolder = urlObj.searchParams.get('subfolder') || '';
                    type = urlObj.searchParams.get('type') || '';
                } catch (_e) {
                    // fallback: try regex
                    const match = url.match(/filename=([^&]+)/);
                    if (match) filename = match[1];
                    const subMatch = url.match(/subfolder=([^&]*)/);
                    if (subMatch) subfolder = subMatch[1];
                    const typeMatch = url.match(/type=([^&]*)/);
                    if (typeMatch) type = typeMatch[1];
                }
                allMedia.push({ url, isVideo, filename, subfolder, type });
            });
        }
    });

    elements.outputImagesContainer.innerHTML = createMediaItemsHtml(allMedia, {
        enableUseAsInput: true,
        containerClass: 'output-images-container',
        itemClass: 'image-item' // unified class
    });
    addMediaClickHandlers('.output-images-container', {
        enableUseAsInput: true,
        imageSelector: '.image-item img'
    });
    
    // Refresh previous outputs if they are currently loaded/visible
    if (previousOutputsLoaded && !elements.previousOutputsList.classList.contains('hidden')) {
        // Reset the loaded flag so it will reload fresh data
        previousOutputsLoaded = false;
        loadPreviousOutputsFromAPI();
    }
    
    console.log('Workflow generation completed successfully');
}

export function cancelRun() {
    if (elements.cancelRunButton.classList.contains('disabled') || !isWorkflowRunning) {
        return;
    }

    // Enhanced cancellation with proper state management
    isWorkflowRunning = false;
    
    // Reset progress bar to clear any pending updates
    progressBarManager.reset();
    
    fetch('/comfyui/interrupt').catch((error) => {
        console.warn('Failed to send interrupt signal:', error);
    });
    
    elements.cancelRunButton.classList.add('disabled');
    
    console.log('Workflow execution cancelled');
}

/**
 * Initializes auto-expand functionality for textareas with the auto-expand class.
 * Makes textareas automatically resize to fit their content.
 */
function initializeAutoExpandTextareas() {
    const autoExpandTextareas = document.querySelectorAll('textarea.workflow-input.auto-expand') as NodeListOf<HTMLTextAreaElement>;
    
    autoExpandTextareas.forEach(textarea => {
        // Set initial height
        adjustTextareaHeight(textarea);
        
        // Add event listeners for input and focus
        textarea.addEventListener('input', () => adjustTextareaHeight(textarea));
        textarea.addEventListener('focus', () => adjustTextareaHeight(textarea));
    });
}

/**
 * Adjusts the height of a textarea to fit its content.
 * @param textarea The textarea element to adjust
 */
function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight}px`;
}

loadWorkflow().catch(error => {
    console.error('Failed to initialize workflow:', error);
});
