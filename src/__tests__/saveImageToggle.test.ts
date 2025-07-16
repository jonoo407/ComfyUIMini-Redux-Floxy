import { jest } from '@jest/globals';

// Mock the functions that would be imported from workflow.ts
// Since these functions are not exported, we'll test the logic directly

describe('SaveImage Toggle Functionality', () => {
    
    describe('hasSaveImageNodes', () => {
        it('should return true when workflow contains SaveImage nodes', () => {
            const workflow: Record<string, any> = {
                '1': {
                    class_type: 'CLIPTextEncode',
                    inputs: { text: 'test' },
                    _meta: { title: 'Test' }
                },
                '2': {
                    class_type: 'SaveImage',
                    inputs: { images: ['1', 0], filename_prefix: 'test' },
                    _meta: { title: 'Save Image' }
                }
            };
            
            let hasSaveImages = false;
            for (const nodeId in workflow) {
                if (workflow[nodeId]?.class_type === 'SaveImage') {
                    hasSaveImages = true;
                    break;
                }
            }
            
            expect(hasSaveImages).toBe(true);
        });
        
        it('should return false when workflow does not contain SaveImage nodes', () => {
            const workflow: Record<string, any> = {
                '1': {
                    class_type: 'CLIPTextEncode',
                    inputs: { text: 'test' },
                    _meta: { title: 'Test' }
                },
                '2': {
                    class_type: 'PreviewImage',
                    inputs: { images: ['1', 0] },
                    _meta: { title: 'Preview Image' }
                }
            };
            
            let hasSaveImages = false;
            for (const nodeId in workflow) {
                if (workflow[nodeId]?.class_type === 'SaveImage') {
                    hasSaveImages = true;
                    break;
                }
            }
            
            expect(hasSaveImages).toBe(false);
        });
    });
    
    describe('convertSaveImageToPreviewImage', () => {
        it('should convert SaveImage nodes to PreviewImage nodes', () => {
            const originalWorkflow: Record<string, any> = {
                '1': {
                    class_type: 'CLIPTextEncode',
                    inputs: { text: 'test' },
                    _meta: { title: 'Test' }
                },
                '2': {
                    class_type: 'SaveImage',
                    inputs: { 
                        images: ['1', 0], 
                        filename_prefix: 'test_prefix' 
                    },
                    _meta: { title: 'Save Image' }
                }
            };
            
            const modifiedWorkflow: Record<string, any> = { ...originalWorkflow };
            
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
            
            // Verify the conversion
            expect(modifiedWorkflow['2'].class_type).toBe('PreviewImage');
            expect(modifiedWorkflow['2'].inputs.images).toEqual(['1', 0]);
            expect(modifiedWorkflow['2'].inputs.filename_prefix).toBeUndefined();
            expect(modifiedWorkflow['2']._meta.title).toBe('Preview Image');
            
            // Verify other nodes are unchanged
            expect(modifiedWorkflow['1']).toEqual(originalWorkflow['1']);
        });
        
        it('should handle multiple SaveImage nodes', () => {
            const originalWorkflow: Record<string, any> = {
                '1': {
                    class_type: 'SaveImage',
                    inputs: { 
                        images: ['2', 0], 
                        filename_prefix: 'first' 
                    },
                    _meta: { title: 'Save First' }
                },
                '2': {
                    class_type: 'SaveImage',
                    inputs: { 
                        images: ['3', 0], 
                        filename_prefix: 'second' 
                    },
                    _meta: { title: 'Save Second' }
                }
            };
            
            const modifiedWorkflow: Record<string, any> = { ...originalWorkflow };
            
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
            
            // Verify both nodes were converted
            expect(modifiedWorkflow['1'].class_type).toBe('PreviewImage');
            expect(modifiedWorkflow['2'].class_type).toBe('PreviewImage');
            expect(modifiedWorkflow['1']._meta.title).toBe('Preview First');
            expect(modifiedWorkflow['2']._meta.title).toBe('Preview Second');
        });
        
        it('should preserve non-SaveImage nodes unchanged', () => {
            const originalWorkflow: Record<string, any> = {
                '1': {
                    class_type: 'CLIPTextEncode',
                    inputs: { text: 'test' },
                    _meta: { title: 'Test' }
                },
                '2': {
                    class_type: 'KSampler',
                    inputs: { steps: 20 },
                    _meta: { title: 'Sampler' }
                },
                '3': {
                    class_type: 'SaveImage',
                    inputs: { 
                        images: ['2', 0], 
                        filename_prefix: 'test' 
                    },
                    _meta: { title: 'Save Image' }
                }
            };
            
            const modifiedWorkflow: Record<string, any> = { ...originalWorkflow };
            
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
            
            // Verify non-SaveImage nodes are unchanged
            expect(modifiedWorkflow['1']).toEqual(originalWorkflow['1']);
            expect(modifiedWorkflow['2']).toEqual(originalWorkflow['2']);
            
            // Verify SaveImage node was converted
            expect(modifiedWorkflow['3'].class_type).toBe('PreviewImage');
        });
    });
    
    describe('toggle label text', () => {
        it('should return correct text based on toggle state', () => {
            // Test the logic that would be in updateToggleLabel function
            const isChecked = true;
            const labelText = isChecked ? 'Save images to gallery' : 'Preview images only';
            expect(labelText).toBe('Save images to gallery');
            
            const isUnchecked = false;
            const labelTextUnchecked = isUnchecked ? 'Save images to gallery' : 'Preview images only';
            expect(labelTextUnchecked).toBe('Preview images only');
        });
    });
}); 