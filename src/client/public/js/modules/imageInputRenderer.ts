import { openInputImagesModal } from '../common/inputImagesModal.js';
import { generateInputId } from '../common/utils.js';
import { extractSubfolderInfo, constructImageUrl } from '../common/imageUtils.js';

export interface ImageRenderConfig {
    node_id: string;
    input_name_in_node: string;
    title: string;
    default: string;
    list: string[];
}

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
    const hiddenInput = `<input type="hidden" id="${id}" class="workflow-input" value="${inputOptions.default}" data-original-filename="${inputOptions.default}">`;
    
    // Create the display button and preview
    const displayButton = `<button type="button" id="${id}-select-button" class="workflow-input image-select-button" data-fallback-images='${JSON.stringify(inputOptions.list || [])}'>
        <span class="icon gallery"></span>
        <span class="button-text">Select Image</span>
    </button>`;
    
    const uploadButton = `<button type="button" id="${id}-upload-button" class="workflow-input image-upload-button">
        <span class="icon upload"></span>
        <span class="button-text">Upload</span>
    </button>
    <input type="file" id="${id}-file_input" data-select-id="${id}" class="file-input" accept="image/jpeg,image/png,image/webp">`;
    
    const editMaskButton = `<button type="button" id="${id}-edit-mask-button" class="workflow-input image-edit-mask-button ${inputOptions.default ? '' : 'disabled'}" ${inputOptions.default ? '' : 'disabled'}>
        <span class="icon mask"></span>
        <span class="button-text">Edit Mask</span>
    </button>`;
    
    // Create image preview using the utility function
    const imagePreview = `<img src="${constructImageUrl(inputOptions.default, 'input')}" class="input-image-preview ${inputOptions.default ? '' : 'hidden'}" id="${id}-preview" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden'); document.getElementById('${id}-edit-mask-button').classList.add('disabled'); document.getElementById('${id}-edit-mask-button').setAttribute('disabled', 'disabled');" onload="this.classList.remove('hidden'); this.nextElementSibling.classList.add('hidden'); document.getElementById('${id}-edit-mask-button').classList.remove('disabled'); document.getElementById('${id}-edit-mask-button').removeAttribute('disabled');">
    <div class="input-image-placeholder ${inputOptions.default ? 'hidden' : ''}">
        <div class="placeholder-content">
            <span class="icon gallery"></span>
            <span class="placeholder-text">No image selected</span>
        </div>
    </div>`;

    const html = `
        ${hiddenInput}
        <div class="image-input-controls">
            ${displayButton}
            ${uploadButton}
            ${editMaskButton}
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

export async function uploadImageFile(file: File, subfolder?: string, type: string = 'input', overwrite?: boolean): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    
    if (subfolder) {
        formData.append('subfolder', subfolder);
    }
    formData.append('type', type);
    
    if (overwrite) {
        formData.append('overwrite', 'true');
    }

    const response = await fetch('/comfyui/upload/image', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }

    const result = await response.json();
    
    // Try different possible locations for the filename
    let filename = result.name || result.filename || result.externalResponse?.name || result.externalResponse?.filename;
    
    // If still no filename, try to get it from the file object
    if (!filename) {
        filename = file.name;
    }

    // If a subfolder was specified, prepend it to the filename
    if (subfolder) {
        filename = `${subfolder}/${filename}`;
    }

    return filename;
}

export async function uploadMaskFile(maskFile: File, originalImageRef: string, subfolder?: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', maskFile);
    formData.append('original_ref', originalImageRef);
    
    if (subfolder) {
        formData.append('subfolder', subfolder);
    }

    const response = await fetch('/comfyui/upload/mask', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Mask upload failed');
    }

    const result = await response.json();
    
    // Try different possible locations for the filename
    let filename = result.name || result.filename || result.externalResponse?.name || result.externalResponse?.filename;
    
    // If still no filename, try to get it from the file object
    if (!filename) {
        filename = maskFile.name;
    }

    // If a subfolder was specified, prepend it to the filename
    if (subfolder) {
        filename = `${subfolder}/${filename}`;
    }

    return filename;
}

// Add event handlers for image selection after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Helper function to update Edit Mask button state
    function updateEditMaskButtonState(inputId: string, hasImage: boolean) {
        const editMaskButton = document.getElementById(`${inputId}-edit-mask-button`) as HTMLButtonElement;
        if (editMaskButton) {
            if (hasImage) {
                editMaskButton.classList.remove('disabled');
                editMaskButton.removeAttribute('disabled');
            } else {
                editMaskButton.classList.add('disabled');
                editMaskButton.setAttribute('disabled', 'disabled');
            }
        }
    }

    // Function to create preview with mask overlay
    async function createPreviewWithMaskOverlay(previewImg: HTMLImageElement, imageSrc: string) {
        try {
            // Check if this is a masked image (contains clipspace)
            const isMaskedImage = imageSrc.includes('clipspace');
            
            if (isMaskedImage) {
                // For masked images, we need to load the original image and overlay the mask
                // Extract the original image filename from the masked image filename
                const maskedFilename = imageSrc.match(/filename=([^&]+)/)?.[1];
                if (!maskedFilename) {
                    previewImg.src = imageSrc;
                    return;
                }
                
                // Remove subfolder prefix and _mask suffix to get original filename
                const { cleanFilename: maskedCleanFilename, subfolder: _maskedSubfolder } = extractSubfolderInfo(maskedFilename);
                let originalFilename = decodeURIComponent(maskedCleanFilename);
                
                // Handle different mask filename patterns
                if (originalFilename.includes('_mask')) {
                    // Remove _mask and any numbers/spaces before .png
                    originalFilename = originalFilename.replace(/_mask\s*\(\d+\)\.png$/, '.png');
                    // If that didn't work, try a simpler replacement
                    if (originalFilename.includes('_mask')) {
                        originalFilename = originalFilename.replace('_mask.png', '.png');
                    }
                }
                
                // Load the original image
                const originalImg = new Image();
                originalImg.crossOrigin = 'anonymous';
                
                originalImg.onload = () => {
                    // Create canvas for the result
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;
                    canvas.width = originalImg.width;
                    canvas.height = originalImg.height;
                    
                    // Load the masked image
                    const maskedImg = new Image();
                    maskedImg.crossOrigin = 'anonymous';
                    
                    maskedImg.onload = () => {
                        // Draw the original image first
                        ctx.drawImage(originalImg, 0, 0);
                        
                        // Get the masked image data to check for alpha
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = maskedImg.width;
                        tempCanvas.height = maskedImg.height;
                        const tempCtx = tempCanvas.getContext('2d')!;
                        tempCtx.drawImage(maskedImg, 0, 0);
                        const maskedData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                        
                        // Add red overlay where there's transparency in the masked image
                        for (let i = 0; i < maskedData.data.length; i += 4) {
                            const alpha = maskedData.data[i + 3];
                            const transparency = 255 - alpha; // How transparent the pixel is
                            
                            if (transparency > 0) {
                                // Add red overlay where there's transparency
                                ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(transparency / 255, 0.5)})`;
                                ctx.fillRect(
                                    (i / 4) % canvas.width, 
                                    Math.floor((i / 4) / canvas.width), 
                                    1, 1
                                );
                            }
                        }
                        
                        // Convert to data URL and set as preview
                        const dataUrl = canvas.toDataURL('image/png');
                        previewImg.src = dataUrl;
                    };
                    
                    maskedImg.onerror = (error) => {
                        console.error('Error loading masked image:', error);
                        // Fallback to original image
                        ctx.drawImage(originalImg, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        previewImg.src = dataUrl;
                    };
                    
                    // Load the masked image
                    maskedImg.src = imageSrc;
                };
                
                originalImg.onerror = (error) => {
                    console.error('Error loading original image:', error);
                    // Fallback to masked image
                    previewImg.src = imageSrc;
                };
                
                // Load the original image - check if it has a subfolder
                const { cleanFilename: _cleanOriginalFilename, subfolder: _originalSubfolder } = extractSubfolderInfo(originalFilename);
                const originalImageUrl = constructImageUrl(originalFilename, 'input');
                originalImg.src = originalImageUrl;
            } else {
                // For non-masked images, just load normally
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    previewImg.src = dataUrl;
                };
                
                img.onerror = (error) => {
                    console.error('Error loading image:', error);
                    previewImg.src = imageSrc;
                };
                
                img.src = imageSrc;
            }
        } catch (error) {
            console.error('Error creating mask overlay:', error);
            // Fallback to original image if there's an error
            previewImg.src = imageSrc;
        }
    }

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
                } catch {
                    // Ignore JSON parse errors, fallbackImages will remain empty array
                }
            }
            
            if (!hiddenInput) return;
            
            await openInputImagesModal({
                onImageSelect: (filename: string, subfolder: string) => {
                    // Combine filename with subfolder if subfolder exists
                    const fullFilename = subfolder ? `${subfolder}/${filename}` : filename;
                    
                    // Update the hidden input value
                    hiddenInput.value = fullFilename;
                    
                    // Update the original filename attribute for mask editing
                    hiddenInput.setAttribute('data-original-filename', fullFilename);
                    
                    // Update the preview image with mask overlay
                    if (previewImg) {
                        const imageUrl = constructImageUrl(fullFilename, 'input');
                        createPreviewWithMaskOverlay(previewImg, imageUrl);
                        previewImg.classList.remove('hidden');
                        
                        // Hide placeholder
                        const placeholder = previewImg.nextElementSibling as HTMLElement;
                        if (placeholder && placeholder.classList.contains('input-image-placeholder')) {
                            placeholder.classList.add('hidden');
                        }
                    }
                    
                    // Enable Edit Mask button
                    updateEditMaskButtonState(inputId, true);
                    
                    // Trigger change event on the hidden input
                    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                },
                fallbackImages
            });
        }
    });

    // Handle upload button clicks
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const uploadButton = target.closest('.image-upload-button') as HTMLButtonElement;
        
        if (uploadButton) {
            e.preventDefault();
            const inputId = uploadButton.id.replace('-upload-button', '');
            const fileInput = document.getElementById(`${inputId}-file_input`) as HTMLInputElement;
            
            if (fileInput) {
                fileInput.click();
            }
        }
    });

    // Handle file uploads
    document.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        
        if (target.classList.contains('file-input')) {
            const file = target.files?.[0];
            if (!file) return;

            const inputId = target.getAttribute('data-select-id');
            if (!inputId) return;

            const hiddenInput = document.getElementById(inputId) as HTMLInputElement;
            const previewImg = document.getElementById(`${inputId}-preview`) as HTMLImageElement;

            try {
                const filename = await uploadImageFile(file);

                // Update the hidden input value
                hiddenInput.value = filename;

                // Update the original filename attribute for mask editing
                hiddenInput.setAttribute('data-original-filename', filename);

                // Update the preview image with mask overlay
                if (previewImg) {
                    const imageUrl = constructImageUrl(filename, 'input');
                    createPreviewWithMaskOverlay(previewImg, imageUrl);
                    previewImg.classList.remove('hidden');
                    
                    // Hide placeholder
                    const placeholder = previewImg.nextElementSibling as HTMLElement;
                    if (placeholder && placeholder.classList.contains('input-image-placeholder')) {
                        placeholder.classList.add('hidden');
                    }
                }

                // Enable Edit Mask button
                updateEditMaskButtonState(inputId, true);

                // Trigger change event on the hidden input
                hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

                // Update the data-fallback-images attribute on the select button
                const selectButton = document.getElementById(`${inputId}-select-button`) as HTMLButtonElement;
                if (selectButton) {
                    const currentFallbackImages = JSON.parse(selectButton.dataset.fallbackImages || '[]');
                    const updatedFallbackImages = [...new Set([...currentFallbackImages, filename])];
                    selectButton.dataset.fallbackImages = JSON.stringify(updatedFallbackImages);
                }

            } catch (error) {
                console.error('Upload failed:', error);
            }

            // Clear the file input
            target.value = '';
        }
    });

    // Add event handler for Edit Mask button
    document.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const editMaskButton = target.closest('.image-edit-mask-button') as HTMLButtonElement;
        if (editMaskButton && !editMaskButton.disabled) {
            e.preventDefault();
            const inputId = editMaskButton.id.replace('-edit-mask-button', '');
            const hiddenInput = document.getElementById(inputId) as HTMLInputElement;
            const previewImg = document.getElementById(`${inputId}-preview`) as HTMLImageElement;
            if (!hiddenInput || !previewImg) return;
            // Get the original filename from the data attribute
            const originalFilename = hiddenInput.getAttribute('data-original-filename') || hiddenInput.value;
            // Construct the original image URL
            const originalImageUrl = constructImageUrl(originalFilename, 'input');
            
            // With /upload/mask, the original image file is modified in place and contains the mask
            // So we should always pass the current image as maskSrc to check for existing alpha data
            const maskSrc = constructImageUrl(hiddenInput.value, 'input');
            // Dynamically import the modal
            const { openMaskCreationModal } = await import('../common/maskCreationModal.js');
            openMaskCreationModal({
                imageSrc: originalImageUrl,
                imageFilename: originalFilename,
                maskSrc,
                onMaskCreated: (newFilename: string) => {
                    // When using /upload/mask, the original image file is modified in place
                    // So newFilename is the same as the original filename
                    hiddenInput.value = newFilename;
                    
                    const imageUrl = constructImageUrl(newFilename, 'input');
                    createPreviewWithMaskOverlay(previewImg, imageUrl);
                    previewImg.classList.remove('hidden');
                    const placeholder = previewImg.nextElementSibling as HTMLElement;
                    if (placeholder && placeholder.classList.contains('input-image-placeholder')) {
                        placeholder.classList.add('hidden');
                    }
                    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                },
            });
        }
    });
}); 