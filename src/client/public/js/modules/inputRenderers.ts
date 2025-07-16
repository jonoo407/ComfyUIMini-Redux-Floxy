import { openInputImagesModal } from '../common/inputImagesModal.js';
import { generateInputId } from '../common/utils.js';

export interface BaseRenderConfig {
    node_id: string;
    input_name_in_node: string;
    title: string;
    default: string;
}

export interface TextRenderConfig extends BaseRenderConfig {
    multiline?: boolean;
    format?: 'single' | 'multiline' | 'dropdown';
    dropdownOptions?: string[];
}

export interface NumberRenderConfig extends BaseRenderConfig {
    step?: number;
    min?: number;
    max?: number;
}

export interface SelectRenderConfig extends BaseRenderConfig {
    list: string[];
}

export interface ImageRenderConfig extends BaseRenderConfig {
    list: string[];
}

export interface BooleanRenderConfig extends BaseRenderConfig {}

/**
 * Creates a consistent input container HTML structure
 * @param id The input ID
 * @param title The input title/label
 * @param inputHtml The HTML content for the input
 * @param additionalClass Optional additional CSS class
 * @returns The complete input container HTML
 */
const createInputContainer = (id: string, title: string, inputHtml: string, additionalClass?: string): string => `
    <div class="workflow-input-container${additionalClass ? ' ' + additionalClass : ''}">
        <label for="${id}">${title}</label>
        <div class="inner-input-wrapper">
            ${inputHtml}
        </div>
    </div>
`;

/**
 * Renders an image input with modal selection and upload functionality.
 * @param {ImageRenderConfig} inputOptions Options for the image input.
 * @returns {string}
 */
export function renderImageInput(inputOptions: ImageRenderConfig): string {
    const id = generateInputId(inputOptions.node_id, inputOptions.input_name_in_node);

    // Create a hidden input to store the selected value
    const hiddenInput = `<input type="hidden" id="${id}" class="workflow-input" value="${inputOptions.default}">`;
    
    // Create the display button and preview
    const displayButton = `<button type="button" id="${id}-select-button" class="workflow-input image-select-button" data-fallback-images='${JSON.stringify(inputOptions.list || [])}'>
        <span class="icon gallery"></span>
        <span class="button-text">Select Image</span>
    </button>`;
    
    const uploadButton = `<label for="${id}-file_input" class="file-input-label"><span class="icon upload"></span></label>
    <input type="file" id="${id}-file_input" data-select-id="${id}" class="file-input" accept="image/jpeg,image/png,image/webp">`;
    
    const imagePreview = `<img src="/comfyui/image?filename=${inputOptions.default}&subfolder=&type=input" class="input-image-preview" id="${id}-preview">`;

    const html = `
        ${hiddenInput}
        <div class="image-input-controls">
            ${displayButton}
            ${uploadButton}
        </div>
        ${imagePreview}
    `;

    return createInputContainer(
        id,
        inputOptions.title,
        html,
        'has-image-upload'
    );
}

// Add event handlers for image selection after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle image selection button clicks
    document.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const selectButton = target.closest('.image-select-button') as HTMLButtonElement;
        
        if (selectButton) {
            e.preventDefault();
            const inputId = selectButton.id.replace('-select-button', '');
            const hiddenInput = document.getElementById(inputId) as HTMLInputElement;
            const previewImg = document.getElementById(`${inputId}-preview`) as HTMLImageElement;

            // Find the inputOptions.list for this input (by DOM traversal)
            // We'll store the list as a data attribute on the select button for easy access
            let fallbackImages: string[] = [];
            if (selectButton.dataset.fallbackImages) {
                try {
                    fallbackImages = JSON.parse(selectButton.dataset.fallbackImages);
                } catch {}
            }
            
            if (!hiddenInput) return;
            
            await openInputImagesModal({
                onImageSelect: (filename: string, subfolder: string) => {
                    // Update the hidden input value
                    hiddenInput.value = filename;
                    
                    // Update the preview image
                    if (previewImg) {
                        const subfolderParam = subfolder ? `&subfolder=${subfolder}` : '';
                        previewImg.src = `/comfyui/image?filename=${filename}${subfolderParam}&type=input`;
                    }
                    
                    // Trigger change event on the hidden input
                    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                },
                fallbackImages
            });
        }
    });
});

/**
 *
 * @param {SelectRenderConfig} inputOptions Options for the select input.
 * @returns {string}
 */
export function renderSelectInput(inputOptions: SelectRenderConfig): string {
    const id = generateInputId(inputOptions.node_id, inputOptions.input_name_in_node);

    const createSelectOptions = (options: string[]) => {
        let optionsHtml = '';

        if (!options.includes(inputOptions.default)) {
            optionsHtml += `<option value="" disabled selected>Couldn't find '${inputOptions.default}'</option>`;
        }

        optionsHtml += options
            .map(
                (item) => `<option value="${item}" ${inputOptions.default == item ? 'selected' : ''} >${item}</option>`
            )
            .join('');

        return optionsHtml;
    };

    return createInputContainer(
        id,
        inputOptions.title,
        `<select id="${id}" class="workflow-input">${createSelectOptions(inputOptions.list)}</select>`
    );
}

/**
 *
 * @param {TextRenderConfig} inputOptions Options for the text input.
 * @returns {string}
 */
export function renderTextInput(inputOptions: TextRenderConfig): string {
    const id = generateInputId(inputOptions.node_id, inputOptions.input_name_in_node);
    const format = inputOptions.format || 'multiline';
    
    let inputHtml = '';
    
    switch (format) {
        case 'single':
            inputHtml = `<input type="text" id="${id}" class="workflow-input" value="${inputOptions.default}">`;
            break;
        case 'dropdown':
            if (inputOptions.dropdownOptions && inputOptions.dropdownOptions.length > 0) {
                const optionsHtml = inputOptions.dropdownOptions
                    .map(option => `<option value="${option}" ${inputOptions.default === option ? 'selected' : ''}>${option}</option>`)
                    .join('');
                inputHtml = `<select id="${id}" class="workflow-input">${optionsHtml}</select>`;
            } else {
                // Fallback to single line if no dropdown options
                inputHtml = `<input type="text" id="${id}" class="workflow-input" value="${inputOptions.default}">`;
            }
            break;
        case 'multiline':
        default:
            const textareaClass = `workflow-input auto-expand`;
            inputHtml = `<textarea id="${id}" class="${textareaClass}" data-multiline="true">${inputOptions.default}</textarea>`;
            break;
    }
    
    return createInputContainer(id, inputOptions.title, inputHtml);
}

/**
 *
 * @param {NumberRenderConfig} inputOptions Options for the number input.
 * @returns {string}
 */
export function renderNumberInput(inputOptions: NumberRenderConfig & { numberfield_format?: 'type' | 'slider' }): string {
    const showRandomiseToggle = inputOptions.input_name_in_node === 'seed';
    const showResolutionSelector =
        inputOptions.input_name_in_node === 'width' || inputOptions.input_name_in_node === 'height';

    const hasAdditionalButton = showRandomiseToggle || showResolutionSelector;

    const id = generateInputId(inputOptions.node_id, inputOptions.input_name_in_node);
    const { default: defaultValue, step, min, max, numberfield_format } = inputOptions;

    const randomiseToggleHTML = `
    <div class="randomise-buttons-container additional-input-buttons-container" data-linked-input-id="${id}">
        <span class="randomise-now-button">↻</span>
        <span class="randomise-input-toggle"></span>
    </div>`;

    const resolutionSelectorHTML = `
    <div class="resolution-selector-container additional-input-buttons-container" data-node-id="${inputOptions.node_id}">
        <span class="resolution-selector-button">
            <span class="icon resize"></span>
        </span> 
    </div>`;

    let inputHtml = '';
    if (numberfield_format === 'slider') {
        const sliderMin = min ?? 0;
        const sliderMax = max ?? 100;
        const sliderStep = step !== undefined ? step : 1;
        const sliderValue = defaultValue !== undefined ? defaultValue : sliderMin;
        inputHtml = `
            <input 
                id="${id}-slider" 
                type="range" 
                min="${sliderMin}" 
                max="${sliderMax}" 
                step="${sliderStep}" 
                value="${sliderValue}" 
                class="workflow-input slider-input"
                oninput="document.getElementById('${id}-value').value = this.value"
            >
            <input 
                id="${id}-value" 
                type="number" 
                min="${sliderMin}" 
                max="${sliderMax}" 
                step="${sliderStep}" 
                value="${sliderValue}" 
                class="workflow-input slider-value-input"
                oninput="document.getElementById('${id}-slider').value = this.value"
            >
        `;
    } else {
        inputHtml = `
            <input 
                id="${id}" 
                type="number" 
                placeholder="${defaultValue}" 
                class="workflow-input ${hasAdditionalButton ? 'has-additional-button' : ''}" 
                value="${defaultValue}"
                ${step !== undefined ? `step="${step}"` : ''}
                ${min !== undefined ? `min="${min}"` : ''} 
                ${max !== undefined ? `max="${max}"` : ''}
            >
        `;
    }

    return createInputContainer(
        id,
        inputOptions.title,
        `
        ${inputHtml}
        ${showRandomiseToggle ? randomiseToggleHTML : ''}
        ${showResolutionSelector ? resolutionSelectorHTML : ''}
    `
    );
}

export function renderBooleanInput(inputOptions: BooleanRenderConfig): string {
    const id = generateInputId(inputOptions.node_id, inputOptions.input_name_in_node);
    const checked = ['true', '1'].includes(String(inputOptions.default).toLowerCase()) ? 'checked' : '';
    return createInputContainer(
        id,
        inputOptions.title,
        `<input type="checkbox" id="${id}" class="workflow-input" ${checked}>`
    );
}
