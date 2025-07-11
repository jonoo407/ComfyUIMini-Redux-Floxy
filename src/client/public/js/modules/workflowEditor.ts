import { WorkflowInstance } from '@shared/classes/Workflow';
import { NormalisedComfyInputInfo, ProcessedObjectInfo } from '@shared/types/ComfyObjectInfo';
import { InputOption, WorkflowMetadata, WorkflowWithMetadata, Workflow } from '@shared/types/Workflow';

export class WorkflowEditor {
    containerElem: HTMLElement;
    titleInput: HTMLInputElement;
    descriptionInput: HTMLTextAreaElement;
    workflowObject: WorkflowInstance | null;
    private inputCount: number;
    private comfyInputsInfo: ProcessedObjectInfo | null;
    private currentFilter: 'all' | 'visible' | 'hidden' = 'all';

    /**
     *
     * @param containerElem The container element in which all of the inputs will be renderered.
     * @param workflowObject The workflow object to render.
     * @param titleInput The title input element.
     * @param descriptionInput The description input element.
     */
    constructor(
        containerElem: HTMLElement,
        workflowObject: WorkflowInstance | null,
        titleInput: HTMLInputElement,
        descriptionInput: HTMLTextAreaElement
    ) {
        this.containerElem = containerElem;
        this.titleInput = titleInput;
        this.descriptionInput = descriptionInput;

        this.inputCount = 0;
        this.comfyInputsInfo = null;

        this.workflowObject = workflowObject;
    }

    /**
     * Renders the workflow inputs.
     */
    public async renderWorkflow() {
        this.ensureWorkflowObject();
        this.inputCount = 0;

        const blankMetadata: WorkflowMetadata = {
            title: 'My Workflow',
            description: '',
            format_version: '3',
            input_options: [],
        };

        const jsonMetadata = this.workflowObject.metadata || blankMetadata;

        this.titleInput.removeAttribute('disabled');
        this.titleInput.value = jsonMetadata.title || 'My Workflow';

        this.descriptionInput.removeAttribute('disabled');
        this.descriptionInput.value = jsonMetadata.description || '';

        this.containerElem.innerHTML = '';
        await this.renderAllInputs();
    }

    /**
     * Updates a workflow object with data from the inputs.
     *
     * @returns The exported workflow object
     */
    public updateJsonWithUserInput(): Workflow {
        this.ensureWorkflowObject();

        const inputOptionsList = [];

        const modifiedWorkflow = structuredClone(this.workflowObject.workflow);

        const allInputs = this.containerElem.querySelectorAll('.input-item');
        for (const inputContainer of allInputs) {
            const inputNodeId = inputContainer.getAttribute('data-node-id');
            if (!inputNodeId) {
                continue;
            }

            const inputNameInNode = inputContainer.getAttribute('data-node-input-name');
            if (!inputNameInNode) {
                continue;
            }

            const inputOptions: InputOption = {} as InputOption;
            inputOptions['node_id'] = inputNodeId;
            inputOptions['input_name_in_node'] = inputNameInNode;

            if (inputContainer.classList.contains('disabled')) {
                inputOptions['disabled'] = true;
                inputOptionsList.push(inputOptions);
                continue;
            }

            const inputTitleElement = inputContainer.querySelector('.workflow-input-title') as HTMLInputElement;

            if (!inputTitleElement) {
                alert(`Error while saving workflow, input title element not found for ${inputNameInNode}`);
                continue;
            }

            inputOptions['title'] = inputTitleElement.value;

            // Get format for STRING type inputs
            const inputNode = this.workflowObject.getNode(inputNodeId);
            const comfyInputType = this.comfyInputsInfo?.[inputNode.class_type]?.[inputNameInNode]?.type;
            
            if (comfyInputType === 'STRING') {
                const formatSelectElement = inputContainer.querySelector('.workflow-input-format') as HTMLSelectElement;
                if (formatSelectElement) {
                    inputOptions['textfield_format'] = formatSelectElement.value as 'single' | 'multiline' | 'dropdown';
                }
            }

            const defaultValueElement = inputContainer.querySelector('.workflow-input-default') as HTMLInputElement;

            if (!defaultValueElement) {
                alert(`Error while saving workflow, default value element not found for ${inputNameInNode}`);
                continue;
            }

            if (comfyInputType === 'BOOLEAN') {
                // Save as boolean
                modifiedWorkflow[inputNodeId].inputs[inputNameInNode] = (defaultValueElement as HTMLInputElement).checked;
            } else {
                modifiedWorkflow[inputNodeId].inputs[inputNameInNode] = defaultValueElement.value;
            }

            inputOptionsList.push(inputOptions);
        }

        // Remove any existing metadata from the workflow
        delete (modifiedWorkflow as any)._comfyuimini_meta;

        return modifiedWorkflow as Workflow;
    }

    /**
     * Gets the metadata object from the current workflow editor state.
     *
     * @returns The metadata object.
     */
    public getMetadata(): WorkflowMetadata {
        this.ensureWorkflowObject();

        const inputOptionsList = [];

        const allInputs = this.containerElem.querySelectorAll('.input-item');
        for (const inputContainer of allInputs) {
            const inputNodeId = inputContainer.getAttribute('data-node-id');
            if (!inputNodeId) {
                continue;
            }

            const inputNameInNode = inputContainer.getAttribute('data-node-input-name');
            if (!inputNameInNode) {
                continue;
            }

            const inputOptions: InputOption = {} as InputOption;
            inputOptions['node_id'] = inputNodeId;
            inputOptions['input_name_in_node'] = inputNameInNode;

            if (inputContainer.classList.contains('disabled')) {
                inputOptions['disabled'] = true;
                inputOptionsList.push(inputOptions);
                continue;
            }

            const inputTitleElement = inputContainer.querySelector('.workflow-input-title') as HTMLInputElement;

            if (!inputTitleElement) {
                alert(`Error while saving workflow, input title element not found for ${inputNameInNode}`);
                continue;
            }

            inputOptions['title'] = inputTitleElement.value;

            // Get format for STRING type inputs
            const inputNode = this.workflowObject.getNode(inputNodeId);
            const comfyInputType = this.comfyInputsInfo?.[inputNode.class_type]?.[inputNameInNode]?.type;
            
            if (comfyInputType === 'STRING') {
                const formatSelectElement = inputContainer.querySelector('.workflow-input-format') as HTMLSelectElement;
                if (formatSelectElement) {
                    inputOptions['textfield_format'] = formatSelectElement.value as 'single' | 'multiline' | 'dropdown';
                }
            }

            inputOptionsList.push(inputOptions);
        }

        const metadata: WorkflowMetadata = {
            title: this.titleInput.value || 'Unnamed Workflow',
            description: this.descriptionInput.value || '',
            format_version: '3',
            input_options: inputOptionsList,
        };

        return metadata;
    }

    /**
     * Filters the inputs based on the current filter setting.
     */
    public filterInputs(filter: 'all' | 'visible' | 'hidden') {
        this.currentFilter = filter;
        
        const inputItems = this.containerElem.querySelectorAll('.input-item');
        
        inputItems.forEach((item) => {
            const isDisabled = item.classList.contains('disabled');
            
            switch (filter) {
                case 'all':
                    item.classList.remove('filtered-out');
                    break;
                case 'visible':
                    if (isDisabled) {
                        item.classList.add('filtered-out');
                    } else {
                        item.classList.remove('filtered-out');
                    }
                    break;
                case 'hidden':
                    if (isDisabled) {
                        item.classList.remove('filtered-out');
                    } else {
                        item.classList.add('filtered-out');
                    }
                    break;
            }
        });
    }

    /**
     * Asserts that the workflow object is not null.
     */
    private ensureWorkflowObject(): asserts this is { workflowObject: WorkflowWithMetadata } {
        if (this.workflowObject === null) {
            throw new Error('Workflow object is null');
        }
    }

    /**
     * Loops through every node and renders each input.
     */
    private async renderAllInputs() {
        this.ensureWorkflowObject();

        // TODO: Replace with function that gets all inputs not just ones in metadata
        const allUserInputOptions = this.workflowObject.getInputOptionsList();

        for (const userInputOptions of allUserInputOptions) {
            const comfyMetadataForInputType = await this.getComfyMetadataForInputType(
                userInputOptions.input_name_in_node,
                userInputOptions.node_id
            );

            if (!comfyMetadataForInputType) {
                continue;
            }

            const inputNode = this.workflowObject.getNode(userInputOptions.node_id);

            const defaultValue = inputNode.inputs[userInputOptions.input_name_in_node].toString();

            await this.renderInput(userInputOptions, comfyMetadataForInputType, defaultValue, inputNode.class_type);
        }

        this.startInputEventListeners();
    }

    /**
     * Gets the `/objectinfo` metadata for a given input id and node id.
     *
     * @param inputType The type of node input. e.g. `seed`, `scheduler`, `ckpt_name`.
     * @param nodeId The ID of the node in the workflow.
     * @returns The metadata for the input type or null if not found.
     */
    private async getComfyMetadataForInputType(
        inputType: string,
        nodeId: string
    ): Promise<NormalisedComfyInputInfo | null> {
        this.ensureWorkflowObject();

        if (!this.comfyInputsInfo) {
            const comfyObjectMetadata = await fetch('/comfyui/inputsinfo');
            const comfyObjectMetadataJson: ProcessedObjectInfo = await comfyObjectMetadata.json();

            this.comfyInputsInfo = comfyObjectMetadataJson;
        }

        const nodeClassType = this.workflowObject.getNode(nodeId).class_type;

        const comfyInputNodeInfo = this.comfyInputsInfo[nodeClassType];

        if (!comfyInputNodeInfo) {
            return null;
        }

        const comfyInputTypeInfo = comfyInputNodeInfo[inputType];

        if (comfyInputTypeInfo) {
            return comfyInputTypeInfo;
        } else {
            return null;
        }
    }

    /**
     * Renders an input based off of input options.
     */
    private async renderInput(
        userInputOptions: InputOption,
        comfyInputTypeMetadata: NormalisedComfyInputInfo,
        defaultValue: string,
        nodeClass: string
    ) {
        this.inputCount += 1;

        const nodeId = userInputOptions.node_id;
        const inputNameInNode = userInputOptions.input_name_in_node;

        const inputTypeText = `[${nodeId}] ${nodeClass}: ${inputNameInNode}`;

        const inputTitle = userInputOptions.title || inputTypeText;

        const idPrefix = `${nodeId}-${inputNameInNode}`;

        const html = `
            <div class="input-item" data-node-id="${nodeId}" data-node-input-name="${inputNameInNode}">
                <div class="options-container">
                    <div class="input-top-container">
                        <span class="input-counter">${this.inputCount}.</span>
                        <div class="icon eye hide-input-button" id="hide-button-${idPrefix}"></div>
                        <span class="input-type-text">${inputTypeText}</span>
                    </div>
                    <label for="${idPrefix}-title">Title</label>
                    <input type="text" id="${idPrefix}-title" placeholder="${inputTitle}" value="${inputTitle}" class="workflow-input workflow-input-title">
                    ${WorkflowEditor.renderDefaultValueInput(comfyInputTypeMetadata, idPrefix, defaultValue, userInputOptions)}
                </div>
                <div class="move-arrows-container">
                    <span class="move-arrow-up">&#x25B2;</span>
                    <span class="move-arrow-down">&#x25BC;</span>
                </div>
            </div>
        `;

        this.containerElem.innerHTML += html;

                    if (userInputOptions.disabled) {
                const hideButtonElement = this.containerElem.querySelector(`#hide-button-${idPrefix}`) as HTMLElement;

                if (!hideButtonElement) {
                    return;
                }

                this.hideInput(hideButtonElement);
            }
    }

    /**
     * Renders a default value input for a input, differs based on input type.
     *
     * @param inputConfig The config for the input.
     * @param idPrefix The id prefix for each element in the input.
     * @param defaultValue The default value for the input from the workflow object.
     * @returns The rendered HTML for the default value input.
     */
    private static renderDefaultValueInput(
        inputConfig: NormalisedComfyInputInfo,
        idPrefix: string,
        defaultValue: string,
        userInputOptions?: InputOption
    ): string {
        const inputDefault = defaultValue ?? inputConfig.default ?? '';

        let inputHTML = '';

        switch (inputConfig.type) {
            case 'ARRAY':
                inputHTML += `<label for="${idPrefix}-default">Default</label>`;
                inputHTML += `<select id="${idPrefix}-default" class="workflow-input workflow-input-default">`;
                for (const option of inputConfig.list) {
                    inputHTML += `<option value="${option}" ${inputDefault == option ? 'selected' : ''}>${option}</option>`;
                }
                inputHTML += '</select>';
                break;
            case 'INT':
            case 'FLOAT':
                inputHTML += `<label for="${idPrefix}-default">Default</label>`;
                inputHTML += `
                    <input type="number" id="${idPrefix}-default" placeholder="${inputDefault}" value="${inputDefault}" class="workflow-input workflow-input-default">
                `;
                break;
            case 'BOOLEAN':
                inputHTML += `<label for="${idPrefix}-default">Default</label>`;
                const checked = ['true', '1'].includes(String(inputDefault).toLowerCase()) ? 'checked' : '';
                inputHTML += `
                    <input type="checkbox" id="${idPrefix}-default" class="workflow-input workflow-input-default" ${checked}>
                `;
                break;
            case `STRING`:
            default:
                // Add format selector for STRING inputs
                const currentFormat = userInputOptions?.textfield_format || 'multiline';
                inputHTML += `
                    <label for="${idPrefix}-format">Form Field</label>
                    <select id="${idPrefix}-format" class="workflow-input workflow-input-format">
                        <option value="single" ${currentFormat === 'single' ? 'selected' : ''}>Single Line</option>
                        <option value="multiline" ${currentFormat === 'multiline' ? 'selected' : ''}>Multi-line</option>
                        <option value="dropdown" ${currentFormat === 'dropdown' ? 'selected' : ''}>Dropdown</option>
                    </select>
                    <label for="${idPrefix}-default">Default</label>
                    <input type="text" id="${idPrefix}-default" placeholder="${inputDefault}" value="${inputDefault}" class="workflow-input workflow-input-default">
                `;
                break;
        }

        return inputHTML;
    }

    /**
     * Adds event listeners to the input container which allow for interaction.
     */
    private startInputEventListeners() {
        this.containerElem.addEventListener('click', (e: MouseEvent) => {
            const target = e.target;

            if (!target || !(target instanceof HTMLElement)) {
                return;
            }

            const targetHasClass = (className: string) => target.classList.contains(className);

            if (targetHasClass('move-arrow-up')) {
                WorkflowEditor.moveUp(target.closest('.input-item'));
            } else if (targetHasClass('move-arrow-down')) {
                WorkflowEditor.moveDown(target.closest('.input-item'));
            } else if (targetHasClass('hide-input-button')) {
                this.hideInput(target);
            }
        });

        // Add filter button event listeners
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const filter = target.getAttribute('data-filter') as 'all' | 'visible' | 'hidden';
                
                if (filter) {
                    // Update active button
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    target.classList.add('active');
                    
                    // Apply filter
                    this.filterInputs(filter);
                }
            });
        });
    }

    /**
     * Move an input up.
     *
     * @param item The input container.
     */
    private static moveUp(item: HTMLElement | null) {
        if (!item) {
            return;
        }

        if (!item.parentNode) {
            return;
        }

        const previousItem = item.previousElementSibling;

        if (previousItem) {
            item.parentNode.insertBefore(item, previousItem);
        }
    }

    /**
     * Move an input down.
     *
     * @param item The input container.
     */
    private static moveDown(item: HTMLElement | null) {
        if (!item) {
            return;
        }

        if (!item.parentNode) {
            return;
        }

        const nextItem = item.nextElementSibling;

        if (nextItem) {
            item.parentNode.insertBefore(nextItem, item);
        }
    }

    /**
     * Hides an input after the eye icon is clicked.
     *
     * @param hideButtonElement The hide button element.
     */
    private hideInput(hideButtonElement: HTMLElement) {
        if (hideButtonElement.classList.contains('hide')) {
            hideButtonElement.classList.add('eye');
            hideButtonElement.classList.remove('hide');

            const inputOptionsContainer = hideButtonElement.closest('.input-item');

            if (!inputOptionsContainer) {
                return;
            }

            inputOptionsContainer.classList.remove('disabled');

            const subInputsForInput = inputOptionsContainer.querySelectorAll('input, select');
            subInputsForInput.forEach((element) => {
                element.removeAttribute('disabled');
            });
        } else {
            hideButtonElement.classList.remove('eye');
            hideButtonElement.classList.add('hide');

            const inputOptionsContainer = hideButtonElement.closest('.input-item');

            if (!inputOptionsContainer) {
                return;
            }

            inputOptionsContainer.classList.add('disabled');

            const subInputsForInput = inputOptionsContainer.querySelectorAll('input, select');
            subInputsForInput.forEach((element) => {
                element.setAttribute('disabled', 'disabled');
            });
        }
        
        // Apply current filter after hiding/showing an input
        this.filterInputs(this.currentFilter);
    }
}
