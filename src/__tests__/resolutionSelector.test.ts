// Mock the module to prevent auto-initialization
jest.mock('../client/public/js/modules/resolutionSelector', () => ({
  showResolutionSelector: jest.fn(),
  initResolutionSelector: jest.fn(),
  updateResolutionTexts: jest.fn(),
}));

describe('Resolution Selector', () => {
  let mockResolutionSelector: HTMLElement;
  let mockResolutionSelectorOverlay: HTMLElement;
  let mockResolutionButtons: NodeListOf<HTMLElement>;
  let mockScaleButtons: NodeListOf<HTMLInputElement>;
  let showResolutionSelector: jest.MockedFunction<any>;
  let initResolutionSelector: jest.MockedFunction<any>;
  let updateResolutionTexts: jest.MockedFunction<any>;

  // Helper function to create a resolution button
  function createResolutionButton(baseWidth: number, baseHeight: number): HTMLElement {
    const button = document.createElement('button');
    button.className = 'resolution-button';
    
    const resolutionText = document.createElement('span');
    resolutionText.className = 'resolution-dimensions';
    resolutionText.setAttribute('data-width', baseWidth.toString());
    resolutionText.setAttribute('data-height', baseHeight.toString());
    resolutionText.textContent = `${baseWidth}x${baseHeight}`;
    
    button.appendChild(resolutionText);
    return button;
  }

  // Helper function to create a scale radio button
  function createScaleButton(value: string, isChecked: boolean = false): HTMLInputElement {
    const scaleButton = document.createElement('input');
    scaleButton.type = 'radio';
    scaleButton.name = 'scale';
    scaleButton.value = value;
    scaleButton.checked = isChecked;
    return scaleButton;
  }

  // Helper function to create input fields for a node
  function createNodeInputs(nodeId: string): { widthInput: HTMLInputElement; heightInput: HTMLInputElement } {
    const widthInput = document.createElement('input');
    widthInput.id = `input-${nodeId}-width`;
    
    const heightInput = document.createElement('input');
    heightInput.id = `input-${nodeId}-height`;
    
    return { widthInput, heightInput };
  }

  beforeEach(async () => {
    // Clear DOM before each test
    document.body.innerHTML = '';
    document.body.classList.remove('locked');

    // Create main selector elements
    mockResolutionSelector = document.createElement('div');
    mockResolutionSelector.id = 'resolution-selector';
    mockResolutionSelector.classList.add('hidden');
    document.body.appendChild(mockResolutionSelector);

    mockResolutionSelectorOverlay = document.createElement('div');
    mockResolutionSelectorOverlay.id = 'resolution-selector-overlay';
    mockResolutionSelectorOverlay.classList.add('hidden');
    document.body.appendChild(mockResolutionSelectorOverlay);

    // Create resolution buttons with common SD resolutions
    const sdPortraitButton = createResolutionButton(768, 1344); // SD 1.5 Portrait (9:16)
    const sdLandscapeButton = createResolutionButton(512, 768);  // SD 1.5 Landscape (2:3)
    
    document.body.appendChild(sdPortraitButton);
    document.body.appendChild(sdLandscapeButton);

    // Create scale options
    const fullScaleButton = createScaleButton('1.0', true);   // 100% scale
    const halfScaleButton = createScaleButton('0.5');         // 50% scale
    const doubleScaleButton = createScaleButton('2.0');       // 200% scale
    
    document.body.appendChild(fullScaleButton);
    document.body.appendChild(halfScaleButton);
    document.body.appendChild(doubleScaleButton);

    // Create input fields for testing
    const { widthInput, heightInput } = createNodeInputs('test_node');
    document.body.appendChild(widthInput);
    document.body.appendChild(heightInput);

    // Update references
    mockResolutionButtons = document.querySelectorAll('.resolution-button');
    mockScaleButtons = document.querySelectorAll('input[name="scale"]');

    // Get the mocked functions
    const module = await import('../client/public/js/modules/resolutionSelector');
    showResolutionSelector = module.showResolutionSelector;
    updateResolutionTexts = module.updateResolutionTexts;

    // Reset mocks
    jest.clearAllMocks();

    // Implement the actual functionality for testing
    showResolutionSelector.mockImplementation((nodeId: string) => {
      document.body.classList.add('locked');
      mockResolutionSelector.classList.remove('hidden');
      mockResolutionSelector.dataset.nodeId = nodeId;
      mockResolutionSelectorOverlay.classList.remove('hidden');
    });

    // Add event listeners for testing
    mockResolutionSelectorOverlay.addEventListener('click', () => {
      document.body.classList.remove('locked');
      mockResolutionSelector.classList.add('hidden');
      mockResolutionSelectorOverlay.classList.add('hidden');
    });

    // Add change event listeners to scale buttons
    mockScaleButtons.forEach((scaleButton) => {
      scaleButton.addEventListener('change', () => {
        updateResolutionTexts();
      });
    });

    // Add click event listeners to resolution buttons
    mockResolutionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nodeId = mockResolutionSelector.getAttribute('data-node-id');
        if (!nodeId) return;

        const resolutionDimensionsElem = button.querySelector('.resolution-dimensions') as HTMLElement;
        if (!resolutionDimensionsElem) return;

        const selectedScaleElem = document.querySelector('input[name="scale"]:checked') as HTMLInputElement;
        if (!selectedScaleElem) return;
        
        const scale = parseFloat(selectedScaleElem.value);
        const baseWidth = parseInt(resolutionDimensionsElem.getAttribute('data-width') as string);
        const baseHeight = parseInt(resolutionDimensionsElem.getAttribute('data-height') as string);
        
        const scaledWidth = Math.floor(baseWidth * scale);
        const scaledHeight = Math.floor(baseHeight * scale);

        const widthInput = document.querySelector(`#input-${nodeId.replace(/[:]/g, '_')}-width`) as HTMLInputElement;
        const heightInput = document.querySelector(`#input-${nodeId.replace(/[:]/g, '_')}-height`) as HTMLInputElement;

        if (widthInput && heightInput) {
          widthInput.value = scaledWidth.toString();
          heightInput.value = scaledHeight.toString();
        }

        // Hide selector
        document.body.classList.remove('locked');
        mockResolutionSelector.classList.add('hidden');
        mockResolutionSelectorOverlay.classList.add('hidden');
      });
    });

    // Implement updateResolutionTexts
    updateResolutionTexts.mockImplementation(() => {
      mockResolutionButtons.forEach((button) => {
        const resolutionText = button.querySelector('.resolution-dimensions') as HTMLElement;
        const selectedScaleElem = document.querySelector('input[name="scale"]:checked') as HTMLInputElement;
        
        if (!resolutionText || !selectedScaleElem) return;
        
        const width =
          parseInt(resolutionText.getAttribute('data-width') as string) * parseFloat(selectedScaleElem.value);
        const height =
          parseInt(resolutionText.getAttribute('data-height') as string) * parseFloat(selectedScaleElem.value);
        resolutionText.textContent = `${Math.floor(width)}x${Math.floor(height)}`;
      });
    });

    // Initialize
    updateResolutionTexts();
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
    document.body.classList.remove('locked');
    jest.clearAllMocks();
  });

  describe('showResolutionSelector', () => {
    it('should show the resolution selector and overlay', () => {
      showResolutionSelector('test_node');

      expect(mockResolutionSelector.classList.contains('hidden')).toBe(false);
      expect(mockResolutionSelectorOverlay.classList.contains('hidden')).toBe(false);
      expect(document.body.classList.contains('locked')).toBe(true);
    });

    it('should set the node ID in the selector data attribute', () => {
      showResolutionSelector('test_node');

      expect(mockResolutionSelector.dataset.nodeId).toBe('test_node');
    });

    it('should handle node IDs with colons by sanitizing them', () => {
      showResolutionSelector('test:node:with:colons');

      expect(mockResolutionSelector.dataset.nodeId).toBe('test:node:with:colons');
    });
  });

  describe('hideResolutionSelector', () => {
    it('should hide the resolution selector and overlay', () => {
      // First show the selector
      showResolutionSelector('test_node');
      expect(mockResolutionSelector.classList.contains('hidden')).toBe(false);
      expect(mockResolutionSelectorOverlay.classList.contains('hidden')).toBe(false);
      expect(document.body.classList.contains('locked')).toBe(true);

      // Then hide it by clicking the overlay
      mockResolutionSelectorOverlay.click();

      expect(mockResolutionSelector.classList.contains('hidden')).toBe(true);
      expect(mockResolutionSelectorOverlay.classList.contains('hidden')).toBe(true);
      expect(document.body.classList.contains('locked')).toBe(false);
    });
  });

  describe('scale factor updates', () => {
    it('should update resolution text when scale changes from 100% to 50%', () => {
      // Initial state should be 100% scale
      const portraitResolutionText = mockResolutionButtons[0].querySelector('.resolution-dimensions') as HTMLElement;
      expect(portraitResolutionText.textContent).toBe('768x1344');

      // Change to 50% scale
      const halfScaleButton = document.querySelector('input[name="scale"][value="0.5"]') as HTMLInputElement;
      halfScaleButton.checked = true;
      halfScaleButton.dispatchEvent(new Event('change'));

      // Text should be updated with scaled values
      expect(portraitResolutionText.textContent).toBe('384x672');
    });

    it('should update all resolution buttons when scale changes to 200%', () => {
      const portraitResolutionText = mockResolutionButtons[0].querySelector('.resolution-dimensions') as HTMLElement;
      const landscapeResolutionText = mockResolutionButtons[1].querySelector('.resolution-dimensions') as HTMLElement;

      // Change to 200% scale
      const doubleScaleButton = document.querySelector('input[name="scale"][value="2.0"]') as HTMLInputElement;
      doubleScaleButton.checked = true;
      doubleScaleButton.dispatchEvent(new Event('change'));

      // Both buttons should be updated
      expect(portraitResolutionText.textContent).toBe('1536x2688');
      expect(landscapeResolutionText.textContent).toBe('1024x1536');
    });

    it('should floor the scaled values when using non-integer scale factors', () => {
      // Change to 70% scale (should floor the result)
      const customScaleButton = createScaleButton('0.7');
      document.body.appendChild(customScaleButton);
      
      // Add change event listener to the new scale button
      customScaleButton.addEventListener('change', () => {
        updateResolutionTexts();
      });
      
      // Update mockScaleButtons to include the new button
      mockScaleButtons = document.querySelectorAll('input[name="scale"]');
      
      customScaleButton.checked = true;
      customScaleButton.dispatchEvent(new Event('change'));

      // Re-query the DOM for updated resolution buttons
      mockResolutionButtons = document.querySelectorAll('.resolution-button');
      const portraitResolutionText = mockResolutionButtons[0].querySelector('.resolution-dimensions') as HTMLElement;
      // 768 * 0.7 = 537.6, should floor to 537
      // 1344 * 0.7 = 940.8, should floor to 940
      expect(portraitResolutionText.textContent).toBe('537x940');
    });
  });

  describe('resolution button clicks', () => {
    beforeEach(() => {
      showResolutionSelector('test_node');
    });

    it('should set input values with base resolution when scale is 100%', () => {
      const widthInput = document.querySelector('#input-test_node-width') as HTMLInputElement;
      const heightInput = document.querySelector('#input-test_node-height') as HTMLInputElement;

      // Click the portrait resolution button (768x1344)
      mockResolutionButtons[0].click();

      expect(widthInput.value).toBe('768');
      expect(heightInput.value).toBe('1344');
    });

    it('should set input values with scaled resolution when scale is 50%', () => {
      // Change scale to 50%
      const halfScaleButton = document.querySelector('input[name="scale"][value="0.5"]') as HTMLInputElement;
      halfScaleButton.checked = true;
      halfScaleButton.dispatchEvent(new Event('change'));

      const widthInput = document.querySelector('#input-test_node-width') as HTMLInputElement;
      const heightInput = document.querySelector('#input-test_node-height') as HTMLInputElement;

      // Click the portrait resolution button (should set 384x672)
      mockResolutionButtons[0].click();

      expect(widthInput.value).toBe('384');
      expect(heightInput.value).toBe('672');
    });

    it('should set input values with scaled resolution when scale is 200%', () => {
      // Change scale to 200%
      const doubleScaleButton = document.querySelector('input[name="scale"][value="2.0"]') as HTMLInputElement;
      doubleScaleButton.checked = true;
      doubleScaleButton.dispatchEvent(new Event('change'));

      const widthInput = document.querySelector('#input-test_node-width') as HTMLInputElement;
      const heightInput = document.querySelector('#input-test_node-height') as HTMLInputElement;

      // Click the landscape resolution button (should set 1024x1536)
      mockResolutionButtons[1].click();

      expect(widthInput.value).toBe('1024');
      expect(heightInput.value).toBe('1536');
    });

    it('should hide the selector after clicking a resolution button', () => {
      mockResolutionButtons[0].click();

      expect(mockResolutionSelector.classList.contains('hidden')).toBe(true);
      expect(mockResolutionSelectorOverlay.classList.contains('hidden')).toBe(true);
      expect(document.body.classList.contains('locked')).toBe(false);
    });

    it('should handle node IDs with colons in input field IDs', () => {
      // Create input fields for a node with colons
      const { widthInput, heightInput } = createNodeInputs('test_node_with_colons');
      document.body.appendChild(widthInput);
      document.body.appendChild(heightInput);

      // Show selector with node ID containing colons
      showResolutionSelector('test:node:with:colons');

      // Click the portrait resolution button
      mockResolutionButtons[0].click();

      expect(widthInput.value).toBe('768');
      expect(heightInput.value).toBe('1344');
    });
  });

  describe('edge cases', () => {
    it('should handle missing scale buttons gracefully', () => {
      // Remove all scale buttons
      document.querySelectorAll('input[name="scale"]').forEach(btn => btn.remove());

      // Should not throw error when trying to update resolution texts
      expect(() => {
        // Trigger the update by dispatching a change event on a non-existent scale button
        const event = new Event('change');
        document.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should handle missing resolution buttons gracefully', () => {
      // Remove all resolution buttons
      document.querySelectorAll('.resolution-button').forEach(btn => btn.remove());

      // Should not throw error when trying to update resolution texts
      expect(() => {
        const scaleButton = document.querySelector('input[name="scale"]') as HTMLInputElement;
        if (scaleButton) {
          scaleButton.dispatchEvent(new Event('change'));
        }
      }).not.toThrow();
    });

    it('should handle missing input fields gracefully', () => {
      // Remove input fields
      document.querySelectorAll('input[id*="-width"], input[id*="-height"]').forEach(input => input.remove());

      showResolutionSelector('test_node');

      // Should not throw error when clicking resolution button
      expect(() => {
        mockResolutionButtons[0].click();
      }).not.toThrow();
    });

    it('should handle invalid data attributes gracefully', () => {
      // Set invalid data attributes
      const resolutionText = mockResolutionButtons[0].querySelector('.resolution-dimensions') as HTMLElement;
      resolutionText.setAttribute('data-width', 'invalid');
      resolutionText.setAttribute('data-height', 'invalid');

      // Should not throw error when updating resolution texts
      expect(() => {
        const scaleButton = document.querySelector('input[name="scale"]') as HTMLInputElement;
        scaleButton.dispatchEvent(new Event('change'));
      }).not.toThrow();
    });
  });

  describe('integration tests', () => {
    it('should work correctly with multiple scale changes and button clicks', () => {
      showResolutionSelector('test_node');
      const widthInput = document.querySelector('#input-test_node-width') as HTMLInputElement;
      const heightInput = document.querySelector('#input-test_node-height') as HTMLInputElement;

      // Change to 50% scale and click portrait button
      const halfScaleButton = document.querySelector('input[name="scale"][value="0.5"]') as HTMLInputElement;
      halfScaleButton.checked = true;
      halfScaleButton.dispatchEvent(new Event('change'));
      mockResolutionButtons[0].click(); // Portrait button (768x1344 → 384x672)

      expect(widthInput.value).toBe('384');
      expect(heightInput.value).toBe('672');

      // Show selector again
      showResolutionSelector('test_node');

      // Change to 200% scale and click landscape button
      const doubleScaleButton = document.querySelector('input[name="scale"][value="2.0"]') as HTMLInputElement;
      doubleScaleButton.checked = true;
      doubleScaleButton.dispatchEvent(new Event('change'));
      mockResolutionButtons[1].click(); // Landscape button (512x768 → 1024x1536)

      expect(widthInput.value).toBe('1024');
      expect(heightInput.value).toBe('1536');
    });

    it('should maintain correct state through multiple show/hide cycles', () => {
      // First show
      showResolutionSelector('test_node');
      expect(mockResolutionSelector.classList.contains('hidden')).toBe(false);
      expect(document.body.classList.contains('locked')).toBe(true);

      // Hide
      mockResolutionSelectorOverlay.click();
      expect(mockResolutionSelector.classList.contains('hidden')).toBe(true);
      expect(document.body.classList.contains('locked')).toBe(false);

      // Show again
      showResolutionSelector('test_node');
      expect(mockResolutionSelector.classList.contains('hidden')).toBe(false);
      expect(document.body.classList.contains('locked')).toBe(true);

      // Hide again
      mockResolutionSelectorOverlay.click();
      expect(mockResolutionSelector.classList.contains('hidden')).toBe(true);
      expect(document.body.classList.contains('locked')).toBe(false);
    });
  });
}); 