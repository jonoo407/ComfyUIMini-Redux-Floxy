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
import { MediaItem } from '@shared/types/History.js';

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
    clearPromptsButton: document.querySelector('.clear-prompts-button') as HTMLButtonElement,
    saveToGalleryToggle: document.querySelector('#save-to-gallery-toggle') as HTMLInputElement,
    toggleLabelText: document.querySelector('#toggle-label-text') as HTMLElement,
    get allFileInputs() {
        return document.querySelectorAll('.workflow-input-container .file-input') as NodeListOf<HTMLElement>;
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

import { toImageFromComfyUIUrl, toImageFromRelativeUrl, toComfyUIUrlFromImage } from '../common/image.js';

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

/**
 * Parses URL parameters to extract node input overrides.
 * Format: ?nodes={"nodeId":{"inputName":"value"}}
 * Example: ?nodes={"12":{"seed":"12345","cfg":"7.5"},"13":{"width":"512"}}
 */
function parseUrlParameters(): Record<string, Record<string, string>> {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const nodesParam = urlSearchParams.get('nodes');
    
    if (!nodesParam) {
        return {};
    }
    
    try {
        const parsedNodes = JSON.parse(decodeURIComponent(nodesParam));
        
        // Validate that it's an object with node structures
        if (typeof parsedNodes === 'object' && parsedNodes !== null && !Array.isArray(parsedNodes)) {
            return parsedNodes;
        } else {
            console.warn('Invalid nodes parameter structure in URL');
            return {};
        }
    } catch (error) {
        console.warn('Failed to parse nodes parameter in URL:', error);
        return {};
    }
}

/**
 * Applies URL parameter values to input fields.
 * URL parameters take priority over saved values.
 */
function applyUrlParameterValues() {
    const nodeParams = parseUrlParameters();
    
    if (Object.keys(nodeParams).length === 0) {
        return;
    }
    
    elements.allWorkflowInputContainers.forEach((inputContainer) => {
        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;
        if (!inputElem) return;
        
        const [, sanitizedNodeId, nodeInputName] = inputElem.id.split('-');
        // Reverse the sanitization - convert underscores back to colons
        const nodeId = sanitizedNodeId.replace(/_/g, ':');
        
        // Check if this node and input have a URL parameter override
        const nodeInputs = nodeParams[nodeId];
        if (nodeInputs && nodeInputs[nodeInputName] !== undefined) {
            const urlValue = nodeInputs[nodeInputName];
            
            // Set the value based on input type
            if (inputElem instanceof HTMLSelectElement) {
                // For select elements, try to find the option with the URL value
                const option = Array.from(inputElem.options).find(opt => opt.value === urlValue);
                if (option) {
                    inputElem.value = urlValue;
                } else {
                    console.warn(`URL parameter value "${urlValue}" not found in select options for ${inputElem.id}`);
                }
            } else {
                // For other input types (text, number, textarea, hidden)
                inputElem.value = urlValue;
                
                // Special handling for image inputs - update preview image
                if (inputContainer.classList.contains('has-image-upload')) {
                    const previewImg = document.getElementById(`${inputElem.id}-preview`) as HTMLImageElement;
                    if (previewImg && urlValue) {
                        // Use the new utility to parse the value and update the preview
                        const imageObj = toImageFromRelativeUrl(urlValue);
                        previewImg.src = toComfyUIUrlFromImage(imageObj);
                    }
                }
            }
            
            // Trigger change event to ensure any dependent logic runs
            inputElem.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

/**
 * Updates the URL with current input values as parameters.
 * This allows users to share the exact configuration they just ran.
 */
function updateUrlWithCurrentParams() {
    const currentUrl = new URL(window.location.href);
    const currentParams = new URLSearchParams(currentUrl.search);
    
    // Collect current input values
    const nodeParams: Record<string, Record<string, string>> = {};
    
    elements.allWorkflowInputContainers.forEach((inputContainer) => {
        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;
        if (!inputElem) return;
        
        const [, sanitizedNodeId, nodeInputName] = inputElem.id.split('-');
        // Reverse the sanitization - convert underscores back to colons
        const nodeId = sanitizedNodeId.replace(/_/g, ':');
        const inputValue = inputElem.value;
        
        // Only add non-empty values
        if (inputValue && inputValue.trim() !== '') {
            if (!nodeParams[nodeId]) {
                nodeParams[nodeId] = {};
            }
            nodeParams[nodeId][nodeInputName] = inputValue;
        }
    });
    
    // Update the nodes parameter in the URL
    if (Object.keys(nodeParams).length > 0) {
        const nodesJson = JSON.stringify(nodeParams);
        currentParams.set('nodes', nodesJson);
    } else {
        // Remove nodes parameter if no inputs have values
        currentParams.delete('nodes');
    }
    
    // Update the URL without reloading the page
    const newUrl = `${currentUrl.pathname}?${currentParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
}


async function loadWorkflow() {
    try {
        await renderInputs(workflowObject, workflowType, workflowIdentifier);
        
        // Apply URL parameter values after inputs are rendered
        applyUrlParameterValues();
        
        // Show/hide save to gallery toggle based on workflow content
        const hasSaveImages = hasSaveImageNodes(workflowObject);
        const toggleContainer = elements.saveToGalleryToggle?.parentElement?.parentElement;
        if (toggleContainer) {
            toggleContainer.style.display = hasSaveImages ? 'flex' : 'none';
        }
        
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
 * Updates the toggle label text based on the toggle state.
 */
function updateToggleLabel() {
    if (elements.toggleLabelText) {
        const isChecked = elements.saveToGalleryToggle?.checked ?? true;
        elements.toggleLabelText.textContent = isChecked ? 'Save output to gallery' : 'Preview images only';
    }
}

/**
 * Starts the event listeners for the various elements on the page.
 */
function startEventListeners() {
    elements.runButton.addEventListener('click', runWorkflow);
    elements.cancelRunButton.addEventListener('click', cancelRun);
    elements.clearPromptsButton.addEventListener('click', clearAllPrompts);

    elements.inputsContainer.addEventListener('click', handleInputContainerClick);

    elements.allFileInputs.forEach((element) => fileUploadEventListener(element));

    elements.previousOutputsToggler.addEventListener('click', togglePreviousOutputs);

    elements.allResolutionSelectors.forEach((resolutionSelector) =>
        resolutionSelectorEventListener(resolutionSelector)
    );

    // Add toggle event listener
    if (elements.saveToGalleryToggle) {
        elements.saveToGalleryToggle.addEventListener('change', updateToggleLabel);
        // Set initial label text
        updateToggleLabel();
    }

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
 * Handles uploading an image file to the server for image inputs.
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
                    return;
                }

                const inputId = inputElement.getAttribute('data-select-id');

                if (!inputId) {
                    console.error('No linked input id found');
                    return;
                }

                const hiddenInput = document.getElementById(inputId) as HTMLInputElement;
                const previewImg = document.getElementById(`${inputId}-preview`) as HTMLImageElement;

                if (!hiddenInput) {
                    console.error('Linked hidden input not found');
                    return;
                }

                // Update the hidden input value with the uploaded filename
                hiddenInput.value = responseJson.externalResponse.name;
                
                // Update the preview image
                if (previewImg) {
                    const imageObj = toImageFromRelativeUrl(responseJson.externalResponse.name);
                    previewImg.src = toComfyUIUrlFromImage(imageObj);
                }
                
                // Trigger change event on the hidden input
                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (err) {
                console.error(err);
            }
        }
    });
}



/**
 * Clears all prompt text areas in the workflow.
 */
function clearAllPrompts() {
    const textareas = document.querySelectorAll('textarea.workflow-input') as NodeListOf<HTMLTextAreaElement>;
    
    textareas.forEach(textarea => {
        textarea.value = '';
        // Trigger auto-expand adjustment
        adjustTextareaHeight(textarea);
    });
    
    console.log(`Cleared ${textareas.length} prompt field(s)`);
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
    } else if (target.classList.contains('clear-individual-button') || target.closest('.clear-individual-button')) {
        // Handle individual clear button clicks
        const button = target.classList.contains('clear-individual-button') ? target : target.closest('.clear-individual-button') as HTMLElement;
        const targetId = button.getAttribute('data-target');
        
        if (targetId) {
            const targetElement = document.getElementById(targetId) as HTMLInputElement | HTMLTextAreaElement;
            if (targetElement) {
                targetElement.value = '';
                targetElement.focus(); // Nice UX touch - focus the cleared field
                
                // Trigger auto-expand adjustment for textareas
                if (targetElement instanceof HTMLTextAreaElement) {
                    adjustTextareaHeight(targetElement);
                }
                
                console.log(`Cleared individual field: ${targetId}`);
            }
        }
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

/**
 * Checks if a workflow contains SaveImage nodes.
 *
 * @param workflow The workflow to check
 * @returns True if the workflow contains SaveImage nodes, false otherwise
 */
function hasSaveImageNodes(workflow: any): boolean {
    for (const nodeId in workflow) {
        if (workflow[nodeId]?.class_type === 'SaveImage') {
            return true;
        }
    }
    return false;
}

/**
 * Converts SaveImage nodes to PreviewImage nodes in a workflow.
 *
 * @param workflow The workflow to modify
 * @returns A new workflow with SaveImage nodes converted to PreviewImage nodes
 */
function convertSaveImageToPreviewImage(workflow: any): any {
    const modifiedWorkflow = { ...workflow };
    
    for (const nodeId in modifiedWorkflow) {
        const node = modifiedWorkflow[nodeId];
        if (node?.class_type === 'SaveImage') {
            // Convert SaveImage to PreviewImage
            modifiedWorkflow[nodeId] = {
                inputs: {
                    images: node.inputs.images // Keep only the images input
                },
                class_type: 'PreviewImage',
                _meta: {
                    title: node._meta?.title?.replace('Save', 'Preview') || 'Preview Image'
                }
            };
        }
    }
    
    return modifiedWorkflow;
}


function generateNodeInputValues(): NodeInputValues {
    const collectingInputValues: NodeInputValues = {};

    elements.allWorkflowInputContainers.forEach((inputContainer) => {
        const randomiseButtonsContainer = inputContainer.querySelector('.randomise-buttons-container');

        if (randomiseButtonsContainer) {
            handleInputRandomise(randomiseButtonsContainer);
        }

        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;

        const [, sanitizedNodeId, nodeInputName] = inputElem.id.split('-');
        // Reverse the sanitization - convert underscores back to colons
        const nodeId = sanitizedNodeId.replace(/_/g, ':');

        // For textarea elements, save the original template string but use formatted date for execution
        // Note: This will include any URL parameter values that were applied to the input fields
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
    
    // Don't reset progress bar here - wait until we receive workflow_structure message
    // This prevents resetting when enqueuing while another workflow is running

    const filledNodeInputValues = generateNodeInputValues();

    let filledWorkflow = new WorkflowInstance(workflowObject).fillWorkflowWithUserInputs(filledNodeInputValues);
    
    // Apply save to gallery toggle logic
    const shouldSaveToGallery = elements.saveToGalleryToggle?.checked ?? true;
    if (!shouldSaveToGallery) {
        filledWorkflow = convertSaveImageToPreviewImage(filledWorkflow);
    }
    
    // Update URL with current input parameters
    updateUrlWithCurrentParams();
    
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
    // Reset progress bar when we receive workflow structure - this means our workflow is now running
    progressBarManager.reset();
    
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
    const allMedia: MediaItem[] = [];
    Object.values(messageData).forEach((mediaUrlArray) => {
        if (Array.isArray(mediaUrlArray)) {
            mediaUrlArray.forEach((url) => {
                // Guess type by extension (could be improved if type info is available)
                const isVideo = url.match(/\.(mp4|webm|ogg)(\?|$)/i) !== null;
                // Parse filename, subfolder, and type from the query string using shared utility
                const { filename, type } = toImageFromComfyUIUrl(url);
                allMedia.push({ url, isVideo, filename, type });
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
