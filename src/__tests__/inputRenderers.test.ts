import {
  renderSelectInput,
  renderTextInput,
  renderNumberInput,
  renderBooleanInput,
  renderImageInput,
  BaseRenderConfig,
  TextRenderConfig,
  NumberRenderConfig,
  SelectRenderConfig,
  BooleanRenderConfig,
  ImageRenderConfig
} from '../client/public/js/modules/inputRenderers';

// Helper function to parse HTML and return DOM elements
function parseHtml(html: string): HTMLElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.firstElementChild as HTMLElement;
}

// Helper function to check if element has attribute with value
function hasAttribute(element: Element, attr: string, value?: string): boolean {
  if (!element.hasAttribute(attr)) return false;
  if (value !== undefined) {
    return element.getAttribute(attr) === value;
  }
  return true;
}

// Helper function to check if element has class
function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

// Helper function to check if element contains text
function containsText(element: Element, text: string): boolean {
  return element.textContent?.includes(text) || false;
}

describe('inputRenderers', () => {
  describe('renderSelectInput', () => {
    const baseConfig: SelectRenderConfig = {
      node_id: 'test-node',
      input_name_in_node: 'test-input',
      title: 'Test Select',
      default: 'option1',
      list: ['option1', 'option2', 'option3']
    };

    it('should render basic select input correctly', () => {
      const html = renderSelectInput(baseConfig);
      const container = parseHtml(html);
      
      expect(container).toBeTruthy();
      expect(container.className).toContain('workflow-input-container');
      
      const label = container.querySelector('label');
      expect(label).toBeTruthy();
      expect(label?.getAttribute('for')).toBe('input-test-node-test-input');
      expect(label?.textContent).toBe('Test Select');
      
      const select = container.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.id).toBe('input-test-node-test-input');
      expect(hasClass(select!, 'workflow-input')).toBe(true);
      
      const options = select?.querySelectorAll('option');
      expect(options).toHaveLength(3);
      expect(options?.[0].value).toBe('option1');
      expect(options?.[0].selected).toBe(true);
      expect(options?.[1].value).toBe('option2');
      expect(options?.[2].value).toBe('option3');
    });

    it('should handle default value not in options list', () => {
      const config = { ...baseConfig, default: 'nonexistent' };
      const html = renderSelectInput(config);
      const container = parseHtml(html);
      
      const select = container.querySelector('select');
      const options = select?.querySelectorAll('option');
      expect(options?.[0].textContent).toContain("Couldn't find 'nonexistent'");
      expect(options?.[0].disabled).toBe(true);
      expect(options?.[0].selected).toBe(true);
    });

    it('should handle empty options list', () => {
      const config = { ...baseConfig, list: [] };
      const html = renderSelectInput(config);
      const container = parseHtml(html);
      
      const select = container.querySelector('select');
      expect(select).toBeTruthy();
      const options = select?.querySelectorAll('option');
      expect(options?.[0].textContent).toContain("Couldn't find 'option1'");
    });
  });

  describe('renderImageInput', () => {
    const baseConfig: ImageRenderConfig = {
      node_id: 'test-node',
      input_name_in_node: 'test-input',
      title: 'Test Image',
      default: 'image1.jpg',
      list: ['image1.jpg', 'image2.png', 'image3.webp']
    };

    it('should render image input with select button and upload elements correctly', () => {
      const html = renderImageInput(baseConfig);
      const container = parseHtml(html);
      
      expect(container).toBeTruthy();
      expect(container.className).toContain('workflow-input-container');
      expect(hasClass(container, 'has-image-upload')).toBe(true);
      
      const label = container.querySelector('label');
      expect(label).toBeTruthy();
      expect(label?.getAttribute('for')).toBe('input-test-node-test-input');
      expect(label?.textContent).toBe('Test Image');
      
      // Check for hidden input
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeTruthy();
      expect(hiddenInput?.id).toBe('input-test-node-test-input');
      expect(hasClass(hiddenInput!, 'workflow-input')).toBe(true);
      expect((hiddenInput as HTMLInputElement)?.value).toBe('image1.jpg');
      
      // Check for select button
      const selectButton = container.querySelector('.image-select-button');
      expect(selectButton).toBeTruthy();
      expect(selectButton?.id).toBe('input-test-node-test-input-select-button');
      expect(hasClass(selectButton!, 'workflow-input')).toBe(true);
      
      // Check for upload button
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();
      expect(fileInput?.getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
      expect(fileInput?.getAttribute('data-select-id')).toBe('input-test-node-test-input');
      
      // Check for image preview
      const imagePreview = container.querySelector('img');
      expect(imagePreview).toBeTruthy();
      expect(imagePreview?.id).toBe('input-test-node-test-input-preview');
      expect(imagePreview?.src).toContain('/comfyui/image?filename=image1.jpg&subfolder=&type=input');
    });

    it('should handle empty default value', () => {
      const config = { ...baseConfig, default: '' };
      const html = renderImageInput(config);
      const container = parseHtml(html);
      
      const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement;
      expect(hiddenInput?.value).toBe('');
      
      const imagePreview = container.querySelector('img') as HTMLImageElement;
      expect(imagePreview?.src).toContain('/comfyui/image?filename=&subfolder=&type=input');
    });

    it('should handle special characters in default value', () => {
      const config = { ...baseConfig, default: 'test image (1).jpg' };
      const html = renderImageInput(config);
      const container = parseHtml(html);
      
      const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement;
      expect(hiddenInput?.value).toBe('test image (1).jpg');
      
      const imagePreview = container.querySelector('img') as HTMLImageElement;
      expect(imagePreview?.src).toContain('/comfyui/image?filename=test%20image%20(1).jpg&subfolder=&type=input');
    });
  });

  describe('renderTextInput', () => {
    const baseConfig: TextRenderConfig = {
      node_id: 'test-node',
      input_name_in_node: 'test-input',
      title: 'Test Text',
      default: 'default value'
    };

    it('should render single line input correctly', () => {
      const config = { ...baseConfig, format: 'single' as const };
      const html = renderTextInput(config);
      const container = parseHtml(html);
      
      expect(container).toBeTruthy();
      expect(container.className).toContain('workflow-input-container');
      
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe('input-test-node-test-input');
      expect(label?.textContent).toBe('Test Text');
      
      const input = container.querySelector('input[type="text"]');
      expect(input).toBeTruthy();
      expect(input?.id).toBe('input-test-node-test-input');
      expect(hasClass(input!, 'workflow-input')).toBe(true);
      expect((input as HTMLInputElement)?.value).toBe('default value');
    });

    it('should render multiline input correctly (default)', () => {
      const html = renderTextInput(baseConfig);
      const container = parseHtml(html);
      
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(hasClass(textarea!, 'workflow-input')).toBe(true);
      expect(hasClass(textarea!, 'auto-expand')).toBe(true);
      expect(textarea?.getAttribute('data-multiline')).toBe('true');
      expect(textarea?.textContent).toBe('default value');
    });

    it('should render dropdown input correctly with options', () => {
      const config = {
        ...baseConfig,
        format: 'dropdown' as const,
        dropdownOptions: ['option1', 'option2', 'option3'],
        default: 'option2'
      };
      const html = renderTextInput(config);
      const container = parseHtml(html);
      
      const select = container.querySelector('select');
      expect(select).toBeTruthy();
      expect(hasClass(select!, 'workflow-input')).toBe(true);
      
      const options = select?.querySelectorAll('option');
      expect(options).toHaveLength(3);
      expect(options?.[0].value).toBe('option1');
      expect(options?.[1].value).toBe('option2');
      expect(options?.[1].selected).toBe(true);
      expect(options?.[2].value).toBe('option3');
    });

    it('should fallback to single line when dropdown has no options', () => {
      const config = {
        ...baseConfig,
        format: 'dropdown' as const,
        dropdownOptions: []
      };
      const html = renderTextInput(config);
      const container = parseHtml(html);
      
      expect(container.querySelector('input[type="text"]')).toBeTruthy();
      expect(container.querySelector('select')).toBeFalsy();
    });

    it('should fallback to single line when dropdown options is undefined', () => {
      const config = {
        ...baseConfig,
        format: 'dropdown' as const
      };
      const html = renderTextInput(config);
      const container = parseHtml(html);
      
      expect(container.querySelector('input[type="text"]')).toBeTruthy();
      expect(container.querySelector('select')).toBeFalsy();
    });

    it('should handle empty default value', () => {
      const config = { ...baseConfig, default: '' };
      const html = renderTextInput(config);
      const container = parseHtml(html);
      
      const textarea = container.querySelector('textarea');
      expect(textarea?.textContent).toBe('');
    });

    it('should handle special characters in default value', () => {
      const config = { ...baseConfig, default: 'test "quote" & <tag>' };
      const html = renderTextInput(config);
      const container = parseHtml(html);
      
      const textarea = container.querySelector('textarea');
      expect(textarea?.textContent).toBe('test "quote" & <tag>');
    });
  });

  describe('renderNumberInput', () => {
    const baseConfig: NumberRenderConfig = {
      node_id: 'test-node',
      input_name_in_node: 'test-input',
      title: 'Test Number',
      default: '42'
    };

    it('should render basic number input correctly', () => {
      const html = renderNumberInput(baseConfig);
      const container = parseHtml(html);
      
      expect(container).toBeTruthy();
      expect(container.className).toContain('workflow-input-container');
      
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe('input-test-node-test-input');
      expect(label?.textContent).toBe('Test Number');
      
      const input = container.querySelector('input[type="number"]');
      expect(input).toBeTruthy();
      expect(input?.id).toBe('input-test-node-test-input');
      expect(hasClass(input!, 'workflow-input')).toBe(true);
      expect((input as HTMLInputElement)?.value).toBe('42');
      expect(input?.getAttribute('placeholder')).toBe('42');
    });

    it('should render slider input correctly', () => {
      const config = {
        ...baseConfig,
        numberfield_format: 'slider' as const,
        min: 0,
        max: 100,
        step: 5
      };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const rangeInput = container.querySelector('input[type="range"]');
      expect(rangeInput).toBeTruthy();
      expect(rangeInput?.id).toBe('input-test-node-test-input-slider');
      expect(rangeInput?.getAttribute('min')).toBe('0');
      expect(rangeInput?.getAttribute('max')).toBe('100');
      expect(rangeInput?.getAttribute('step')).toBe('5');
      expect((rangeInput as HTMLInputElement)?.value).toBe('42');
      expect(hasClass(rangeInput!, 'slider-input')).toBe(true);
      
      const numberInput = container.querySelector('input[type="number"]');
      expect(numberInput).toBeTruthy();
      expect(numberInput?.id).toBe('input-test-node-test-input-value');
      expect(hasClass(numberInput!, 'slider-value-input')).toBe(true);
    });

    it('should use default values for slider when min/max/step are not provided', () => {
      const config = {
        ...baseConfig,
        numberfield_format: 'slider' as const
      };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const rangeInput = container.querySelector('input[type="range"]');
      expect(rangeInput?.getAttribute('min')).toBe('0');
      expect(rangeInput?.getAttribute('max')).toBe('100');
      expect(rangeInput?.getAttribute('step')).toBe('1');
    });

    it('should include step attribute when provided', () => {
      const config = { ...baseConfig, step: 0.5 };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('step')).toBe('0.5');
    });

    it('should include min attribute when provided', () => {
      const config = { ...baseConfig, min: 10 };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('min')).toBe('10');
    });

    it('should include max attribute when provided', () => {
      const config = { ...baseConfig, max: 100 };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('max')).toBe('100');
    });

    it('should not include undefined attributes', () => {
      const html = renderNumberInput(baseConfig);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('step')).toBeFalsy();
      expect(input?.getAttribute('min')).toBeFalsy();
      expect(input?.getAttribute('max')).toBeFalsy();
    });

    it('should add has-additional-button class for seed input', () => {
      const config = { ...baseConfig, input_name_in_node: 'seed' };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(hasClass(input!, 'has-additional-button')).toBe(true);
      
      expect(container.querySelector('.randomise-buttons-container')).toBeTruthy();
      expect(container.querySelector('.randomise-now-button')).toBeTruthy();
      expect(container.querySelector('.randomise-input-toggle')).toBeTruthy();
    });

    it('should add has-additional-button class for width input', () => {
      const config = { ...baseConfig, input_name_in_node: 'width' };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(hasClass(input!, 'has-additional-button')).toBe(true);
      
      expect(container.querySelector('.resolution-selector-container')).toBeTruthy();
      expect(container.querySelector('.resolution-selector-button')).toBeTruthy();
    });

    it('should add has-additional-button class for height input', () => {
      const config = { ...baseConfig, input_name_in_node: 'height' };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(hasClass(input!, 'has-additional-button')).toBe(true);
      
      expect(container.querySelector('.resolution-selector-container')).toBeTruthy();
      expect(container.querySelector('.resolution-selector-button')).toBeTruthy();
    });

    it('should not add additional buttons for regular number inputs', () => {
      const html = renderNumberInput(baseConfig);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="number"]');
      expect(hasClass(input!, 'has-additional-button')).toBe(false);
      expect(container.querySelector('.randomise-buttons-container')).toBeFalsy();
      expect(container.querySelector('.resolution-selector-container')).toBeFalsy();
    });

    it('should handle undefined default value in slider', () => {
      const config = {
        ...baseConfig,
        default: undefined as any,
        numberfield_format: 'slider' as const,
        min: 10,
        max: 50
      };
      const html = renderNumberInput(config);
      const container = parseHtml(html);
      
      const rangeInput = container.querySelector('input[type="range"]');
      expect((rangeInput as HTMLInputElement)?.value).toBe('10'); // Should use min as default
    });
  });

  describe('renderBooleanInput', () => {
    const baseConfig: BooleanRenderConfig = {
      node_id: 'test-node',
      input_name_in_node: 'test-input',
      title: 'Test Boolean',
      default: 'true'
    };

    it('should render checked checkbox for true value', () => {
      const html = renderBooleanInput(baseConfig);
      const container = parseHtml(html);
      
      expect(container).toBeTruthy();
      expect(container.className).toContain('workflow-input-container');
      
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe('input-test-node-test-input');
      expect(label?.textContent).toBe('Test Boolean');
      
      const input = container.querySelector('input[type="checkbox"]');
      expect(input).toBeTruthy();
      expect(input?.id).toBe('input-test-node-test-input');
      expect(hasClass(input!, 'workflow-input')).toBe(true);
      expect((input as HTMLInputElement)?.checked).toBe(true);
    });

    it('should render unchecked checkbox for false value', () => {
      const config = { ...baseConfig, default: 'false' };
      const html = renderBooleanInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="checkbox"]');
      expect((input as HTMLInputElement)?.checked).toBe(false);
    });

    it('should render checked checkbox for "1" value', () => {
      const config = { ...baseConfig, default: '1' };
      const html = renderBooleanInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="checkbox"]');
      expect((input as HTMLInputElement)?.checked).toBe(true);
    });

    it('should render checked checkbox for "TRUE" value (case insensitive)', () => {
      const config = { ...baseConfig, default: 'TRUE' };
      const html = renderBooleanInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="checkbox"]');
      expect((input as HTMLInputElement)?.checked).toBe(true);
    });

    it('should render unchecked checkbox for "0" value', () => {
      const config = { ...baseConfig, default: '0' };
      const html = renderBooleanInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="checkbox"]');
      expect((input as HTMLInputElement)?.checked).toBe(false);
    });

    it('should render unchecked checkbox for empty string', () => {
      const config = { ...baseConfig, default: '' };
      const html = renderBooleanInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="checkbox"]');
      expect((input as HTMLInputElement)?.checked).toBe(false);
    });

    it('should render unchecked checkbox for undefined value', () => {
      const config = { ...baseConfig, default: undefined as any };
      const html = renderBooleanInput(config);
      const container = parseHtml(html);
      
      const input = container.querySelector('input[type="checkbox"]');
      expect((input as HTMLInputElement)?.checked).toBe(false);
    });
  });

  describe('createInputContainer (internal function)', () => {
    it('should create container with basic structure', () => {
      const html = renderTextInput({
        node_id: 'test',
        input_name_in_node: 'test',
        title: 'Test',
        default: 'value'
      });
      const container = parseHtml(html);
      
      expect(hasClass(container, 'workflow-input-container')).toBe(true);
      
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe('input-test-test');
      expect(label?.textContent).toBe('Test');
      
      expect(container.querySelector('.inner-input-wrapper')).toBeTruthy();
    });

    it('should add additional class when provided', () => {
      const html = renderImageInput({
        node_id: 'test',
        input_name_in_node: 'test',
        title: 'Test',
        default: 'value',
        list: ['value']
      });
      const container = parseHtml(html);
      
      expect(hasClass(container, 'has-image-upload')).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle special characters in node_id and input_name_in_node', () => {
      const html = renderTextInput({
        node_id: 'test-node_123',
        input_name_in_node: 'input-name_456',
        title: 'Test',
        default: 'value'
      });
      const container = parseHtml(html);
      
      const input = container.querySelector('textarea');
      expect(input?.id).toBe('input-test-node_123-input-name_456');
      
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe('input-test-node_123-input-name_456');
    });

    it('should handle HTML in title', () => {
      const html = renderTextInput({
        node_id: 'test',
        input_name_in_node: 'test',
        title: '<script>alert("xss")</script>',
        default: 'value'
      });
      const container = parseHtml(html);
      
      const label = container.querySelector('label');
      // The DOMParser will parse the HTML and extract the text content
      expect(label?.textContent).toBe('alert("xss")');
    });

    it('should handle very long default values', () => {
      const longValue = 'a'.repeat(1000);
      const html = renderTextInput({
        node_id: 'test',
        input_name_in_node: 'test',
        title: 'Test',
        default: longValue
      });
      const container = parseHtml(html);
      
      const textarea = container.querySelector('textarea');
      expect(textarea?.textContent).toBe(longValue);
    });

    it('should handle numeric default values', () => {
      const html = renderTextInput({
        node_id: 'test',
        input_name_in_node: 'test',
        title: 'Test',
        default: 42 as any
      });
      const container = parseHtml(html);
      
      const textarea = container.querySelector('textarea');
      expect(textarea?.textContent).toBe('42');
    });
  });
}); 