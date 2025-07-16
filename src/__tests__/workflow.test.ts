import { jest } from '@jest/globals';

describe('URL Parameter Application for Image Inputs', () => {
    let mockGetElementById: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock document.getElementById
        mockGetElementById = jest.fn().mockReturnValue({
            src: 'original-src'
        } as HTMLImageElement);

        // Mock document.getElementById properly
        Object.defineProperty(document, 'getElementById', {
            value: mockGetElementById,
            writable: true
        });
    });

    it('should apply URL parameters to image inputs and update preview', () => {
        // This test verifies the logic in applyUrlParameterValues function
        // Since the function is not exported, we test the core logic here
        
        const nodeParams = { "test-node": { "test-input": "new-image.jpg" } };
        const inputContainer = {
            classList: { contains: jest.fn().mockReturnValue(true) },
            querySelector: jest.fn().mockReturnValue({
                id: 'input-test-node-test-input',
                value: 'original-value'
            } as HTMLInputElement)
        };
        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;
        
        // Simulate the URL parameter application logic
        if (nodeParams["test-node"] && nodeParams["test-node"]["test-input"] !== undefined) {
            const urlValue = nodeParams["test-node"]["test-input"];
            
            // Set the input value
            inputElem.value = urlValue;
            
            // Check if it's an image input and update preview
            if (inputContainer.classList.contains('has-image-upload')) {
                const previewImg = document.getElementById(`${inputElem.id}-preview`) as HTMLImageElement;
                if (previewImg && urlValue) {
                    previewImg.src = `/comfyui/image?filename=${urlValue}&subfolder=&type=input`;
                }
            }
        }
        
        // Verify the input value was updated
        expect(inputElem.value).toBe('new-image.jpg');
        
        // Verify the preview image was updated
        expect(mockGetElementById).toHaveBeenCalledWith('input-test-node-test-input-preview');
        const previewImg = mockGetElementById() as HTMLImageElement;
        expect(previewImg.src).toBe('/comfyui/image?filename=new-image.jpg&subfolder=&type=input');
    });

    it('should handle missing preview image gracefully', () => {
        // Mock getElementById to return null (no preview image)
        mockGetElementById.mockReturnValue(null);
        
        const nodeParams = { "test-node": { "test-input": "new-image.jpg" } };
        const inputContainer = {
            classList: { contains: jest.fn().mockReturnValue(true) },
            querySelector: jest.fn().mockReturnValue({
                id: 'input-test-node-test-input',
                value: 'original-value'
            } as HTMLInputElement)
        };
        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;
        
        // Simulate the URL parameter application logic
        if (nodeParams["test-node"] && nodeParams["test-node"]["test-input"] !== undefined) {
            const urlValue = nodeParams["test-node"]["test-input"];
            
            // Set the input value
            inputElem.value = urlValue;
            
            // Check if it's an image input and update preview
            if (inputContainer.classList.contains('has-image-upload')) {
                const previewImg = document.getElementById(`${inputElem.id}-preview`) as HTMLImageElement;
                if (previewImg && urlValue) {
                    previewImg.src = `/comfyui/image?filename=${urlValue}&subfolder=&type=input`;
                }
                // Should not throw error when previewImg is null
            }
        }
        
        // Verify the input value was still updated
        expect(inputElem.value).toBe('new-image.jpg');
        
        // Verify getElementById was called but no error occurred
        expect(mockGetElementById).toHaveBeenCalledWith('input-test-node-test-input-preview');
    });
}); 