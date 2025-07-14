import { InputOption, WorkflowWithMetadata } from '@shared/types/Workflow.js';
import { BaseRenderConfig, renderNumberInput, renderSelectInput, renderTextInput, renderBooleanInput } from './inputRenderers.js';
import { NormalisedComfyInputInfo, ProcessedObjectInfo } from '@shared/types/ComfyObjectInfo.js';
import { getSavedInputs } from './savedInputValues.js';
import { openPopupWindow, PopupWindowType } from '../common/popupWindow.js';

const inputsContainer = document.querySelector('.inputs-container') as HTMLElement;

// Cache for inputs info to avoid repeated network requests
let inputsInfoObject: ProcessedObjectInfo | null = null;

async function getInputsInfo(): Promise<ProcessedObjectInfo> {
    if (!inputsInfoObject) {
        const inputsInfoResponse = await fetch('/comfyui/inputsinfo');
        
        if (!inputsInfoResponse.ok) {
            openPopupWindow('Could not fetch inputs info', PopupWindowType.ERROR, inputsInfoResponse.statusText);
            throw new Error(`Failed to fetch inputs info: ${inputsInfoResponse.statusText}`);
        }
        
        inputsInfoObject = await inputsInfoResponse.json();
    }
    return inputsInfoObject!;
}

export async function renderInputs(workflowObject: WorkflowWithMetadata, workflowType: string, workflowIdentifier: string) {
    const workflowJson = workflowObject;
    const userInputsMetadata = workflowJson['_comfyuimini_meta'].input_options;

    // Get inputs info once
    const inputsInfo = await getInputsInfo();
    
    // Batch localStorage access - get all saved values at once
    const savedInputs = getSavedInputs();
    const savedValues = savedInputs[workflowType]?.[workflowIdentifier] || {};

    // Use array instead of string concatenation for better performance
    const renderedInputsArray: string[] = [];
    
    for (const userInputMetadata of userInputsMetadata) {
        if (userInputMetadata.disabled) {
            continue;
        }

        const inputNode = workflowJson[userInputMetadata.node_id];

        // Use cached saved values instead of individual localStorage calls
        const savedDefaultValue = savedValues[userInputMetadata.node_id]?.[userInputMetadata.input_name_in_node];
        const originalDefaultValue = inputNode.inputs[userInputMetadata.input_name_in_node].toString();

        const defaultValue = savedDefaultValue ?? originalDefaultValue;

        const comfyInputInfo = inputsInfo[inputNode.class_type][userInputMetadata.input_name_in_node];

        if (!comfyInputInfo) {
            console.warn(`No input info found for ${userInputMetadata.input_name_in_node} in ${inputNode.class_type}`);
            continue;
        }
        const renderedInput = renderInput(userInputMetadata, defaultValue, comfyInputInfo, originalDefaultValue);
        renderedInputsArray.push(renderedInput);
    }

    // Use DocumentFragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderedInputsArray.join('');
    
    // Move all child nodes to the fragment
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    
    // Clear and append in one operation
    inputsContainer.innerHTML = '';
    inputsContainer.appendChild(fragment);
}

export function renderInput(
    userInputMetadata: InputOption,
    defaultValue: string,
    comfyInputInfo: NormalisedComfyInputInfo,
    originalDefaultValue?: string
) {
    const inputType = comfyInputInfo.type;

    const baseRenderOptions: BaseRenderConfig = {
        node_id: userInputMetadata.node_id,
        input_name_in_node: userInputMetadata.input_name_in_node,
        title: userInputMetadata.title,
        default: defaultValue,
    };

    switch (inputType) {
        case 'STRING': {
            const textRenderOptions: any = {
                multiline: comfyInputInfo.multiline,
                format: userInputMetadata.textfield_format || 'multiline',
                ...baseRenderOptions,
            };

            // If format is dropdown, get the original dropdown options from the workflow's default value
            if (textRenderOptions.format === 'dropdown' && originalDefaultValue) {
                const dropdownOptions = originalDefaultValue.split(',').map((option: string) => option.trim()).filter((option: string) => option.length > 0);
                if (dropdownOptions.length > 0) {
                    textRenderOptions.dropdownOptions = dropdownOptions;
                    // Use the current defaultValue (from saved values or last prompt) as the selected option
                    // If the current value is not in the original options, fall back to the first option
                    if (dropdownOptions.includes(defaultValue)) {
                        textRenderOptions.default = defaultValue;
                    } else {
                        textRenderOptions.default = dropdownOptions[0];
                    }
                }
            }

            return renderTextInput(textRenderOptions);
        }

        case 'INT':
        case 'FLOAT': {
            const numberRenderOptions = {
                step: comfyInputInfo.step,
                min: userInputMetadata.min ?? comfyInputInfo.min,
                max: userInputMetadata.max ?? comfyInputInfo.max,
                numberfield_format: userInputMetadata.numberfield_format,
                ...baseRenderOptions,
            };

            return renderNumberInput(numberRenderOptions);
        }

        case 'ARRAY': {
            const selectRenderOptions = {
                list: comfyInputInfo.list,
                imageUpload: comfyInputInfo.imageUpload,
                ...baseRenderOptions,
            };

            return renderSelectInput(selectRenderOptions);
        }

        case 'BOOLEAN': {
            return renderBooleanInput(baseRenderOptions);
        }

        default: {
            console.error(`No renderer found for input type ${inputType}`);
            return `No renderer found for input type ${inputType}`;
        }
    }
}
