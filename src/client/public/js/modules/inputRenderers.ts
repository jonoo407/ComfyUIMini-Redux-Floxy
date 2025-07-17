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
