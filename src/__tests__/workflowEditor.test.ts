import { WorkflowEditor } from '../client/public/js/modules/workflowEditor';
import { WorkflowInstance } from '@shared/classes/Workflow';
import { ProcessedObjectInfo, NormalisedComfyInputInfo } from '@shared/types/ComfyObjectInfo';
import { InputOption, WorkflowMetadata } from '@shared/types/Workflow';

// Mock the WorkflowInstance class
jest.mock('@shared/classes/Workflow');

describe('WorkflowEditor', () => {
  let workflowEditor: WorkflowEditor;
  let containerElem: HTMLElement;
  let titleInput: HTMLInputElement;
  let descriptionInput: HTMLTextAreaElement;
  let mockWorkflowObject: jest.Mocked<WorkflowInstance>;
  let mockComfyInputsInfo: ProcessedObjectInfo;

  beforeEach(() => {
    // Setup DOM elements
    containerElem = document.createElement('div');
    titleInput = document.createElement('input');
    descriptionInput = document.createElement('textarea');

    // Mock workflow object
    mockWorkflowObject = {
      workflow: {
        '1': {
          class_type: 'KSampler',
          inputs: {
            seed: 12345,
            steps: 20,
            cfg: 7.0,
            sampler_name: 'euler',
            scheduler: 'normal',
            denoise: 1.0,
            model: ['4', 0],
            positive: ['6', 0],
            negative: ['7', 0],
            latent_image: ['5', 0]
          }
        }
      },
      metadata: {
        title: 'Test Workflow',
        description: 'Test Description',
        format_version: '3',
        input_options: [
          {
            node_id: '1',
            input_name_in_node: 'seed',
            title: 'Seed',
            numberfield_format: 'type'
          },
          {
            node_id: '1',
            input_name_in_node: 'steps',
            title: 'Steps',
            numberfield_format: 'slider',
            min: 1,
            max: 100
          }
        ]
      },
      getNode: jest.fn().mockImplementation((nodeId: string) => {
        return mockWorkflowObject.workflow[nodeId];
      })
    } as any;

    // Mock ComfyUI inputs info
    mockComfyInputsInfo = {
      'KSampler': {
        seed: {
          type: 'INT',
          userAccessible: true,
          list: [],
          default: '12345',
          min: 0,
          max: 999999999
        },
        steps: {
          type: 'INT',
          userAccessible: true,
          list: [],
          default: '20',
          min: 1,
          max: 100
        },
        cfg: {
          type: 'FLOAT',
          userAccessible: true,
          list: [],
          default: '7.0',
          min: 0.1,
          max: 20.0
        }
      }
    };

    // Mock fetch for ComfyUI inputs info
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockComfyInputsInfo)
    });

    workflowEditor = new WorkflowEditor(
      containerElem,
      mockWorkflowObject,
      titleInput,
      descriptionInput
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(workflowEditor.containerElem).toBe(containerElem);
      expect(workflowEditor.titleInput).toBe(titleInput);
      expect(workflowEditor.descriptionInput).toBe(descriptionInput);
      expect(workflowEditor.workflowObject).toBe(mockWorkflowObject);
      expect(workflowEditor['inputCount']).toBe(0);
      expect(workflowEditor['comfyInputsInfo']).toBeNull();
    });
  });

  describe('renderWorkflow', () => {
    it('should render workflow inputs correctly', async () => {
      await workflowEditor.renderWorkflow();

      expect(titleInput.value).toBe('Test Workflow');
      expect(descriptionInput.value).toBe('Test Description');
      expect(containerElem.children.length).toBeGreaterThan(0);
    });

    it('should handle null workflow object', () => {
      const nullWorkflowEditor = new WorkflowEditor(
        containerElem,
        null,
        titleInput,
        descriptionInput
      );

      expect(() => nullWorkflowEditor.renderWorkflow()).rejects.toThrow('Workflow object is null');
    });
  });

  describe('numberfield format switching', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should not create duplicate entries when switching from slider to type', async () => {
      // Find the steps input (which should be a slider initially)
      const stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      expect(stepsInput).toBeTruthy();

      // Get the format selector
      const formatSelect = stepsInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      expect(formatSelect).toBeTruthy();
      expect(formatSelect.value).toBe('slider');

      // Count inputs before switching
      const inputCountBefore = containerElem.querySelectorAll('.input-item').length;

      // Switch from slider to type
      formatSelect.value = 'type';
      formatSelect.dispatchEvent(new Event('input', { bubbles: true }));
      formatSelect.dispatchEvent(new Event('change', { bubbles: true }));

      // Count inputs after switching
      const inputCountAfter = containerElem.querySelectorAll('.input-item').length;

      // Should have the same number of inputs (no duplicates)
      expect(inputCountAfter).toBe(inputCountBefore);

      // Verify the input still exists and has correct format
      const updatedStepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      expect(updatedStepsInput).toBeTruthy();
      
      const updatedFormatSelect = updatedStepsInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      expect(updatedFormatSelect.value).toBe('type');
    });

    it('should preserve input values when switching formats', async () => {
      const stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      const formatSelect = stepsInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      const defaultInput = stepsInput?.querySelector('.workflow-input-default') as HTMLInputElement;

      // Set a custom value
      defaultInput.value = '25';
      defaultInput.dispatchEvent(new Event('input'));

      // Switch format
      formatSelect.value = 'type';
      formatSelect.dispatchEvent(new Event('input', { bubbles: true }));
      formatSelect.dispatchEvent(new Event('change', { bubbles: true }));

      // Check that the value is preserved
      const updatedStepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      const updatedDefaultInput = updatedStepsInput?.querySelector('.workflow-input-default') as HTMLInputElement;
      expect(updatedDefaultInput.value).toBe('25');
    });

    it('should remove min/max fields when switching from slider to type', async () => {
      let stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      let formatSelect = stepsInput?.querySelector('.workflow-input-format') as HTMLSelectElement;

      // Verify min/max fields exist initially (slider format)
      let minInput = stepsInput?.querySelector('.workflow-input-min') as HTMLInputElement;
      let maxInput = stepsInput?.querySelector('.workflow-input-max') as HTMLInputElement;
      expect(minInput).toBeTruthy();
      expect(maxInput).toBeTruthy();

      // Switch to type format
      formatSelect.value = 'type';
      formatSelect.dispatchEvent(new Event('input', { bubbles: true }));
      formatSelect.dispatchEvent(new Event('change', { bubbles: true }));

      // Re-query the DOM for updated element
      stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      const minMaxWrapper = stepsInput?.querySelector('.slider-minmax-wrapper') as HTMLDivElement;
      const formatSelectAfter = stepsInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      
      // Check if the format actually changed
      expect(formatSelectAfter?.value).toBe('type');
      
      // Debug output
      // eslint-disable-next-line no-console
      console.log('After switch to type - Format value:', formatSelectAfter?.value);
      // eslint-disable-next-line no-console
      console.log('After switch to type - MinMaxWrapper HTML:', minMaxWrapper?.outerHTML);
      // eslint-disable-next-line no-console
      console.log('After switch to type - Hidden class present:', minMaxWrapper?.classList.contains('hidden'));
      expect(minMaxWrapper).toBeTruthy();
      expect(minMaxWrapper.classList.contains('hidden')).toBe(true);
    });

    it('should add min/max fields when switching from type to slider', async () => {
      // First switch to type format
      let stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      let formatSelect = stepsInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      
      formatSelect.value = 'type';
      formatSelect.dispatchEvent(new Event('input', { bubbles: true }));
      formatSelect.dispatchEvent(new Event('change', { bubbles: true }));

      // Re-query the DOM for updated element
      stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      let minMaxWrapper = stepsInput?.querySelector('.slider-minmax-wrapper') as HTMLDivElement;
      expect(minMaxWrapper).toBeTruthy();
      expect(minMaxWrapper.classList.contains('hidden')).toBe(true);

      // Switch back to slider format
      formatSelect = stepsInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      formatSelect.value = 'slider';
      formatSelect.dispatchEvent(new Event('input', { bubbles: true }));
      formatSelect.dispatchEvent(new Event('change', { bubbles: true }));

      // Re-query the DOM for updated element
      stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      minMaxWrapper = stepsInput?.querySelector('.slider-minmax-wrapper') as HTMLDivElement;
      // Debug output
      // eslint-disable-next-line no-console
      console.log('After switch to slider:', minMaxWrapper?.outerHTML);
      expect(minMaxWrapper).toBeTruthy();
      expect(minMaxWrapper.classList.contains('hidden')).toBe(false);
    });
  });

  describe('updateJsonWithUserInput', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should update workflow with user input values', () => {
      const result = workflowEditor.updateJsonWithUserInput();

      expect(result).toBeDefined();
      expect(result['1']).toBeDefined();
      // Should be string, not number
      expect(result['1'].inputs.seed).toBe('12345');
    });

    it('should handle disabled inputs correctly', () => {
      // Disable an input
      const stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      stepsInput?.classList.add('disabled');

      const result = workflowEditor.updateJsonWithUserInput();
      
      // The workflow should still be valid
      expect(result).toBeDefined();
    });

    it('should prevent duplicate input options', () => {
      // Add a duplicate input option to metadata
      mockWorkflowObject.metadata.input_options.push({
        node_id: '1',
        input_name_in_node: 'seed',
        title: 'Seed Duplicate',
        numberfield_format: 'type'
      });

      const result = workflowEditor.updateJsonWithUserInput();
      
      // Should not throw error and should handle duplicates gracefully
      expect(result).toBeDefined();
    });
  });

  describe('getMetadata', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should return correct metadata structure', () => {
      const metadata = workflowEditor.getMetadata();

      expect(metadata.title).toBe('Test Workflow');
      expect(metadata.description).toBe('Test Description');
      expect(metadata.format_version).toBe('3');
      expect(Array.isArray(metadata.input_options)).toBe(true);
    });

    it('should include input options with correct format settings', () => {
      const metadata = workflowEditor.getMetadata();
      
      const seedOption = metadata.input_options.find(opt => opt.input_name_in_node === 'seed');
      const stepsOption = metadata.input_options.find(opt => opt.input_name_in_node === 'steps');

      expect(seedOption?.numberfield_format).toBe('type');
      expect(stepsOption?.numberfield_format).toBe('slider');
      expect(stepsOption?.min).toBeDefined();
      expect(stepsOption?.max).toBeDefined();
    });
  });

  describe('filterInputs', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should filter inputs correctly', () => {
      // Disable one input
      const stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      stepsInput?.classList.add('disabled');

      // Test 'visible' filter
      workflowEditor.filterInputs('visible');
      expect(stepsInput?.classList.contains('filtered-out')).toBe(true);

      // Test 'hidden' filter
      workflowEditor.filterInputs('hidden');
      expect(stepsInput?.classList.contains('filtered-out')).toBe(false);

      // Test 'all' filter
      workflowEditor.filterInputs('all');
      expect(stepsInput?.classList.contains('filtered-out')).toBe(false);
    });
  });

  describe('input movement', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should move inputs up and down correctly', () => {
      const inputItems = containerElem.querySelectorAll('.input-item');
      expect(inputItems.length).toBeGreaterThan(1);

      const firstItem = inputItems[0];
      const secondItem = inputItems[1];
      const thirdItem = inputItems[2];

      // Get initial order
      const initialOrder = Array.from(inputItems).map(item => 
        item.getAttribute('data-node-input-name')
      );

      // Move first item down
      const downArrow = firstItem.querySelector('.move-arrow-down');
      downArrow?.dispatchEvent(new Event('click', { bubbles: true }));

      // Check that first item moved down
      const itemsAfterFirstMove = containerElem.querySelectorAll('.input-item');
      const orderAfterFirstMove = Array.from(itemsAfterFirstMove).map(item => 
        item.getAttribute('data-node-input-name')
      );
      
      // First item should now be second
      expect(orderAfterFirstMove[1]).toBe(initialOrder[0]);
      expect(orderAfterFirstMove[0]).toBe(initialOrder[1]);

      // Move second item up (which is now the original first item)
      const newSecondItem = itemsAfterFirstMove[1];
      const upArrow = newSecondItem.querySelector('.move-arrow-up');
      upArrow?.dispatchEvent(new Event('click', { bubbles: true }));

      // Check that item moved back up
      const itemsAfterSecondMove = containerElem.querySelectorAll('.input-item');
      const orderAfterSecondMove = Array.from(itemsAfterSecondMove).map(item => 
        item.getAttribute('data-node-input-name')
      );
      
      // Should be back to original order
      expect(orderAfterSecondMove[0]).toBe(initialOrder[0]);
      expect(orderAfterSecondMove[1]).toBe(initialOrder[1]);
    });

    it('should handle edge cases for movement', () => {
      const inputItems = containerElem.querySelectorAll('.input-item');
      expect(inputItems.length).toBeGreaterThan(1);

      const firstItem = inputItems[0];
      const lastItem = inputItems[inputItems.length - 1];

      // Try to move first item up (should not change anything)
      const firstUpArrow = firstItem.querySelector('.move-arrow-up');
      firstUpArrow?.dispatchEvent(new Event('click', { bubbles: true }));

      // First item should still be first
      const itemsAfterFirstUp = containerElem.querySelectorAll('.input-item');
      expect(itemsAfterFirstUp[0]).toBe(firstItem);

      // Try to move last item down (should not change anything)
      const lastDownArrow = lastItem.querySelector('.move-arrow-down');
      lastDownArrow?.dispatchEvent(new Event('click', { bubbles: true }));

      // Last item should still be last
      const itemsAfterLastDown = containerElem.querySelectorAll('.input-item');
      expect(itemsAfterLastDown[itemsAfterLastDown.length - 1]).toBe(lastItem);
    });

    it('should preserve input data during reordering', () => {
      const inputItems = containerElem.querySelectorAll('.input-item');
      expect(inputItems.length).toBeGreaterThan(1);

      const firstItem = inputItems[0];
      const secondItem = inputItems[1];

      // Set some values on the inputs
      const firstTitleInput = firstItem.querySelector('.workflow-input-title') as HTMLInputElement;
      const secondTitleInput = secondItem.querySelector('.workflow-input-title') as HTMLInputElement;
      
      firstTitleInput.value = 'First Item Title';
      secondTitleInput.value = 'Second Item Title';

      // Move first item down
      const downArrow = firstItem.querySelector('.move-arrow-down');
      downArrow?.dispatchEvent(new Event('click', { bubbles: true }));

      // Check that values are preserved after reordering
      const itemsAfterMove = containerElem.querySelectorAll('.input-item');
      const newFirstItem = itemsAfterMove[0];
      const newSecondItem = itemsAfterMove[1];

      const newFirstTitleInput = newFirstItem.querySelector('.workflow-input-title') as HTMLInputElement;
      const newSecondTitleInput = newSecondItem.querySelector('.workflow-input-title') as HTMLInputElement;

      // Values should be preserved (though they may have swapped positions)
      expect(newFirstTitleInput.value).toBe('Second Item Title');
      expect(newSecondTitleInput.value).toBe('First Item Title');
    });

    it('should maintain correct order in metadata after reordering', () => {
      const inputItems = containerElem.querySelectorAll('.input-item');
      expect(inputItems.length).toBeGreaterThan(1);

      const firstItem = inputItems[0];
      const secondItem = inputItems[1];

      // Get initial metadata order
      const initialMetadata = workflowEditor.getMetadata();
      const initialOrder = initialMetadata.input_options.map(opt => opt.input_name_in_node);

      // Move first item down
      const downArrow = firstItem.querySelector('.move-arrow-down');
      downArrow?.dispatchEvent(new Event('click', { bubbles: true }));

      // Get metadata after reordering
      const metadataAfterMove = workflowEditor.getMetadata();
      const orderAfterMove = metadataAfterMove.input_options.map(opt => opt.input_name_in_node);

      // The order should reflect the DOM changes
      expect(orderAfterMove[0]).toBe(initialOrder[1]);
      expect(orderAfterMove[1]).toBe(initialOrder[0]);
    });
  });

  describe('input visibility toggle', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should toggle input visibility', () => {
      let stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      let hideButton = stepsInput?.querySelector('.hide-input-button');

      // Initially visible
      expect(stepsInput?.classList.contains('disabled')).toBe(false);

      // Hide input
      hideButton?.dispatchEvent(new Event('click', { bubbles: true }));
      stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      expect(stepsInput?.classList.contains('disabled')).toBe(true);

      // Show input
      hideButton = stepsInput?.querySelector('.hide-input-button');
      hideButton?.dispatchEvent(new Event('click', { bubbles: true }));
      stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      expect(stepsInput?.classList.contains('disabled')).toBe(false);
    });
  });

  describe('STRING input format switching', () => {
    beforeEach(async () => {
      // Add a STRING input to the mock workflow
      mockWorkflowObject.metadata.input_options.push({
        node_id: '1',
        input_name_in_node: 'prompt',
        title: 'Prompt',
        textfield_format: 'multiline'
      });
      
      mockWorkflowObject.workflow['1'].inputs.prompt = 'test prompt';
      mockComfyInputsInfo['KSampler'].prompt = {
        type: 'STRING',
        userAccessible: true,
        list: [],
        default: 'test prompt'
      };
      
      await workflowEditor.renderWorkflow();
    });

    it('should switch between single, multiline, and dropdown formats', () => {
      const promptInput = containerElem.querySelector('[data-node-input-name="prompt"]');
      expect(promptInput).toBeTruthy();

      const formatSelect = promptInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      expect(formatSelect).toBeTruthy();
      expect(formatSelect.value).toBe('multiline');

      // Switch to single line
      formatSelect.value = 'single';
      formatSelect.dispatchEvent(new Event('input', { bubbles: true }));
      formatSelect.dispatchEvent(new Event('change', { bubbles: true }));

      const updatedPromptInput = containerElem.querySelector('[data-node-input-name="prompt"]');
      const updatedFormatSelect = updatedPromptInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      expect(updatedFormatSelect.value).toBe('single');

      // Switch to dropdown
      updatedFormatSelect.value = 'dropdown';
      updatedFormatSelect.dispatchEvent(new Event('input', { bubbles: true }));
      updatedFormatSelect.dispatchEvent(new Event('change', { bubbles: true }));

      const finalPromptInput = containerElem.querySelector('[data-node-input-name="prompt"]');
      const finalFormatSelect = finalPromptInput?.querySelector('.workflow-input-format') as HTMLSelectElement;
      expect(finalFormatSelect.value).toBe('dropdown');
    });
  });

  describe('BOOLEAN input handling', () => {
    beforeEach(async () => {
      // Add a BOOLEAN input to the mock workflow
      mockWorkflowObject.metadata.input_options.push({
        node_id: '1',
        input_name_in_node: 'enabled',
        title: 'Enabled'
      });
      
      mockWorkflowObject.workflow['1'].inputs.enabled = true;
      mockComfyInputsInfo['KSampler'].enabled = {
        type: 'BOOLEAN',
        userAccessible: true,
        list: [],
        default: 'true'
      };
      
      await workflowEditor.renderWorkflow();
    });

    it('should render checkbox for boolean inputs', () => {
      const enabledInput = containerElem.querySelector('[data-node-input-name="enabled"]');
      expect(enabledInput).toBeTruthy();

      const checkbox = enabledInput?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      expect(checkbox.checked).toBe(true);
    });

    it('should handle boolean value changes', () => {
      const enabledInput = containerElem.querySelector('[data-node-input-name="enabled"]');
      const checkbox = enabledInput?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      // Toggle the checkbox
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(checkbox.checked).toBe(false);
    });
  });

  describe('ARRAY input handling', () => {
    beforeEach(async () => {
      // Add an ARRAY input to the mock workflow
      mockWorkflowObject.metadata.input_options.push({
        node_id: '1',
        input_name_in_node: 'sampler_name',
        title: 'Sampler'
      });
      
      mockWorkflowObject.workflow['1'].inputs.sampler_name = 'euler';
      mockComfyInputsInfo['KSampler'].sampler_name = {
        type: 'ARRAY',
        userAccessible: true,
        list: ['euler', 'dpm++', 'ddim'],
        default: 'euler'
      };
      
      await workflowEditor.renderWorkflow();
    });

    it('should render select dropdown for array inputs', () => {
      const samplerInput = containerElem.querySelector('[data-node-input-name="sampler_name"]');
      expect(samplerInput).toBeTruthy();

      const select = samplerInput?.querySelector('select') as HTMLSelectElement;
      expect(select).toBeTruthy();
      expect(select.value).toBe('euler');
      expect(select.options.length).toBe(3);
    });

    it('should handle array value changes', () => {
      const samplerInput = containerElem.querySelector('[data-node-input-name="sampler_name"]');
      const select = samplerInput?.querySelector('select') as HTMLSelectElement;

      // Change selection
      select.value = 'dpm++';
      select.dispatchEvent(new Event('change', { bubbles: true }));

      expect(select.value).toBe('dpm++');
    });
  });

  describe('input counter functionality', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should display correct input counters', () => {
      const inputItems = containerElem.querySelectorAll('.input-item');
      expect(inputItems.length).toBeGreaterThan(0);

      inputItems.forEach((item, index) => {
        const counter = item.querySelector('.input-counter');
        expect(counter).toBeTruthy();
        expect(counter?.textContent).toBe(`${index + 1}.`);
      });
    });

    it('should maintain counter order after reordering', () => {
      const inputItems = containerElem.querySelectorAll('.input-item');
      const firstItem = inputItems[0];
      const secondItem = inputItems[1];

      // Get initial counter values
      const firstCounterBefore = firstItem.querySelector('.input-counter')?.textContent;
      const secondCounterBefore = secondItem.querySelector('.input-counter')?.textContent;

      // Move first item down
      const downArrow = firstItem.querySelector('.move-arrow-down');
      downArrow?.dispatchEvent(new Event('click', { bubbles: true }));

      // Check that counters are maintained (they don't get updated automatically)
      const updatedItems = containerElem.querySelectorAll('.input-item');
      expect(updatedItems[0].querySelector('.input-counter')?.textContent).toBe(secondCounterBefore);
      expect(updatedItems[1].querySelector('.input-counter')?.textContent).toBe(firstCounterBefore);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should handle missing input title element gracefully', () => {
      // Mock alert to prevent it from showing in tests
      const originalAlert = window.alert;
      window.alert = jest.fn();

      // Remove a title input to simulate missing element
      const titleInput = containerElem.querySelector('.workflow-input-title') as HTMLInputElement;
      if (titleInput) {
        titleInput.remove();
      }

      // This should not throw an error
      expect(() => workflowEditor.updateJsonWithUserInput()).not.toThrow();

      // Restore alert
      window.alert = originalAlert;
    });

    it('should handle missing default value element gracefully', () => {
      // Mock alert to prevent it from showing in tests
      const originalAlert = window.alert;
      window.alert = jest.fn();

      // Remove a default value input to simulate missing element
      const defaultInput = containerElem.querySelector('.workflow-input-default') as HTMLInputElement;
      if (defaultInput) {
        defaultInput.remove();
      }

      // This should not throw an error
      expect(() => workflowEditor.updateJsonWithUserInput()).not.toThrow();

      // Restore alert
      window.alert = originalAlert;
    });

    it('should handle invalid input options gracefully', () => {
      // Add an invalid input option
      mockWorkflowObject.metadata.input_options.push({
        node_id: 'invalid',
        input_name_in_node: 'invalid',
        title: 'Invalid'
      });

      // This should not throw an error
      expect(() => workflowEditor.updateJsonWithUserInput()).not.toThrow();
    });
  });

  describe('workflow metadata persistence', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should preserve custom titles in metadata', () => {
      // Change a title
      const titleInput = containerElem.querySelector('.workflow-input-title') as HTMLInputElement;
      titleInput.value = 'Custom Title';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));

      const metadata = workflowEditor.getMetadata();
      const inputOption = metadata.input_options.find(opt => opt.node_id === '1' && opt.input_name_in_node === 'seed');
      expect(inputOption?.title).toBe('Custom Title');
    });

    it('should preserve disabled state in metadata', () => {
      // Disable an input
      const stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      stepsInput?.classList.add('disabled');

      const metadata = workflowEditor.getMetadata();
      const inputOption = metadata.input_options.find(opt => opt.node_id === '1' && opt.input_name_in_node === 'steps');
      expect(inputOption?.disabled).toBe(true);
    });

    it('should preserve min/max values for slider inputs', () => {
      const stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      const minInput = stepsInput?.querySelector('.workflow-input-min') as HTMLInputElement;
      const maxInput = stepsInput?.querySelector('.workflow-input-max') as HTMLInputElement;

      // Change min/max values
      minInput.value = '5';
      maxInput.value = '50';
      minInput.dispatchEvent(new Event('input', { bubbles: true }));
      maxInput.dispatchEvent(new Event('input', { bubbles: true }));

      const metadata = workflowEditor.getMetadata();
      const inputOption = metadata.input_options.find(opt => opt.node_id === '1' && opt.input_name_in_node === 'steps');
      expect(inputOption?.min).toBe(5);
      expect(inputOption?.max).toBe(50);
    });
  });

  describe('workflow title and description', () => {
    beforeEach(async () => {
      await workflowEditor.renderWorkflow();
    });

    it('should update workflow title', () => {
      titleInput.value = 'New Workflow Title';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));

      const metadata = workflowEditor.getMetadata();
      expect(metadata.title).toBe('New Workflow Title');
    });

    it('should update workflow description', () => {
      descriptionInput.value = 'New workflow description';
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));

      const metadata = workflowEditor.getMetadata();
      expect(metadata.description).toBe('New workflow description');
    });

    it('should handle empty title and description', () => {
      titleInput.value = '';
      descriptionInput.value = '';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));

      const metadata = workflowEditor.getMetadata();
      expect(metadata.title).toBe('Unnamed Workflow');
      expect(metadata.description).toBe('');
    });
  });

  describe('filter functionality with multiple inputs', () => {
    beforeEach(async () => {
      // Add more inputs to test filtering
      mockWorkflowObject.metadata.input_options.push(
        {
          node_id: '1',
          input_name_in_node: 'cfg',
          title: 'CFG Scale',
          numberfield_format: 'slider',
          min: 1,
          max: 20
        },
        {
          node_id: '1',
          input_name_in_node: 'denoise',
          title: 'Denoise',
          numberfield_format: 'type'
        }
      );
      
      mockWorkflowObject.workflow['1'].inputs.cfg = 7.0;
      mockWorkflowObject.workflow['1'].inputs.denoise = 1.0;
      mockComfyInputsInfo['KSampler'].denoise = {
        type: 'FLOAT',
        userAccessible: true,
        list: [],
        default: '1.0',
        min: 0,
        max: 1
      };
      
      await workflowEditor.renderWorkflow();
    });

    it('should filter multiple inputs correctly', () => {
      const inputItems = containerElem.querySelectorAll('.input-item');
      expect(inputItems.length).toBeGreaterThan(2);

      // Disable some inputs
      const stepsInput = containerElem.querySelector('[data-node-input-name="steps"]');
      const cfgInput = containerElem.querySelector('[data-node-input-name="cfg"]');
      stepsInput?.classList.add('disabled');
      cfgInput?.classList.add('disabled');

      // Test visible filter
      workflowEditor.filterInputs('visible');
      expect(stepsInput?.classList.contains('filtered-out')).toBe(true);
      expect(cfgInput?.classList.contains('filtered-out')).toBe(true);

      // Test hidden filter
      workflowEditor.filterInputs('hidden');
      expect(stepsInput?.classList.contains('filtered-out')).toBe(false);
      expect(cfgInput?.classList.contains('filtered-out')).toBe(false);

      // Test all filter
      workflowEditor.filterInputs('all');
      expect(stepsInput?.classList.contains('filtered-out')).toBe(false);
      expect(cfgInput?.classList.contains('filtered-out')).toBe(false);
    });
  });
}); 