const elements = {
    get resolutionSelector() {
        return document.querySelector('#resolution-selector') as HTMLElement;
    },
    get resolutionSelectorOverlay() {
        return document.querySelector('#resolution-selector-overlay') as HTMLElement;
    },
    get allResolutionButtons() {
        return document.querySelectorAll('.resolution-button') as NodeListOf<HTMLElement>;
    },
    get allResolutionScaleButtons() {
        return document.querySelectorAll('input[name="scale"]') as NodeListOf<HTMLInputElement>;
    },
};

/**
 * Sanitizes a node ID for use in CSS selectors by replacing invalid characters.
 * @param nodeId The node ID to sanitize
 * @returns A sanitized version safe for use in CSS selectors
 */
function sanitizeNodeId(nodeId: string): string {
    return nodeId.replace(/[:]/g, '_');
}

function updateResolutionTexts() {
    elements.allResolutionButtons.forEach((button) => {
        const resolutionText = button.querySelector('.resolution-dimensions') as HTMLElement;
        const selectedScaleElem = document.querySelector('input[name="scale"]:checked') as HTMLInputElement;
        
        if (!resolutionText || !selectedScaleElem) return;
        
        const width =
            parseInt(resolutionText.getAttribute('data-width') as string) * parseFloat(selectedScaleElem.value);
        const height =
            parseInt(resolutionText.getAttribute('data-height') as string) * parseFloat(selectedScaleElem.value);
        resolutionText.textContent = `${Math.floor(width)}x${Math.floor(height)}`;
    });
}

/**
 *
 * @param nodeId The id of the node to change the width and height of through the input.
 */
function showResolutionSelector(nodeId: string) {
    if (!elements.resolutionSelector || !elements.resolutionSelectorOverlay) return;
    
    document.body.classList.add('locked');
    elements.resolutionSelector.classList.remove('hidden');
    elements.resolutionSelector.dataset.nodeId = nodeId;
    elements.resolutionSelectorOverlay.classList.remove('hidden');
}

function hideResolutionSelector() {
    if (!elements.resolutionSelector || !elements.resolutionSelectorOverlay) return;
    
    document.body.classList.remove('locked');
    elements.resolutionSelector.classList.add('hidden');
    elements.resolutionSelectorOverlay.classList.add('hidden');
}

// Set up event listeners when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
    setupEventListeners();
}

function setupEventListeners() {
    // Add overlay click listener
    if (elements.resolutionSelectorOverlay) {
        elements.resolutionSelectorOverlay.addEventListener('click', hideResolutionSelector);
    }
    
    // Add change event listeners to scale buttons
    elements.allResolutionScaleButtons.forEach((scaleButton) => {
        scaleButton.addEventListener('change', updateResolutionTexts);
    });
    
    // Add click event listeners to resolution buttons
    elements.allResolutionButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const nodeId = elements.resolutionSelector?.getAttribute('data-node-id') as string;
            if (!nodeId) return;

            const resolutionDimensionsElem = button.querySelector('.resolution-dimensions') as HTMLElement;
            if (!resolutionDimensionsElem) return;

            // Get the scaled values that are currently displayed in the text
            const selectedScaleElem = document.querySelector('input[name="scale"]:checked') as HTMLInputElement;
            if (!selectedScaleElem) return;
            
            const scale = parseFloat(selectedScaleElem.value);
            const baseWidth = parseInt(resolutionDimensionsElem.getAttribute('data-width') as string);
            const baseHeight = parseInt(resolutionDimensionsElem.getAttribute('data-height') as string);
            
            const scaledWidth = Math.floor(baseWidth * scale);
            const scaledHeight = Math.floor(baseHeight * scale);

            const widthInput = document.querySelector(`#input-${sanitizeNodeId(nodeId)}-width`) as HTMLInputElement;
            const heightInput = document.querySelector(`#input-${sanitizeNodeId(nodeId)}-height`) as HTMLInputElement;

            if (widthInput && heightInput) {
                widthInput.value = scaledWidth.toString();
                heightInput.value = scaledHeight.toString();
            }

            hideResolutionSelector();
        });
    });
    
    // Initial update of resolution texts
    updateResolutionTexts();
}

export { showResolutionSelector, updateResolutionTexts };
