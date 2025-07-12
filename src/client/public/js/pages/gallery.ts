import { openImageModal } from '../common/imageModal.js';
import { openOverlay } from '../common/overlay.js';
import { updateNavigationButtons } from '../common/galleryNavigation.js';

const pageInput = document.getElementById('page-input') as HTMLInputElement;

// Get page information from DOM data attributes
const currentPage = parseInt(document.body.getAttribute('data-current-page') || '0', 10);
const totalPages = parseInt(document.body.getAttribute('data-total-pages') || '0', 10);

if (document.body.hasAttribute('data-error')) {
    alert(document.body.getAttribute('data-error'));
}

if (pageInput) {
    pageInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            window.location.href = `?page=${pageInput.value}`;
        }
    });
}



// Add click handlers to all images in the gallery (videos don't need modal)
document.addEventListener('DOMContentLoaded', () => {
    // Update navigation buttons based on current page
    const imageItems = document.querySelectorAll('.image-item');
    updateNavigationButtons(currentPage, totalPages, imageItems);
    
    const images = document.querySelectorAll('.image-item img');
    
    images.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        imageElement.style.cursor = 'pointer';
        imageElement.addEventListener('click', (e) => {
            e.preventDefault();
            const imageSrc = imageElement.src;
            const imageAlt = imageElement.alt || 'Gallery image';
            openImageModal(imageSrc, imageAlt);
        });
    });

    // Add "Use as Input" handlers
    const useAsInputButtons = document.querySelectorAll('.use-as-input-button');
    
    useAsInputButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const useAsInputButton = button as HTMLButtonElement;
            const filename = useAsInputButton.dataset.filename;
            
            if (!filename) {
                console.error('No filename found for use as input button');
                return;
            }
            
            const imageItem = useAsInputButton.closest('.image-item') as HTMLElement;
            if (imageItem) {
                // Show confirmation overlay before uploading
                openOverlay({
                    content: 'Use image for workflow inputs?',
                    buttons: [
                        {
                            label: 'Cancel',
                            className: 'overlay-cancel',
                        },
                        {
                            label: 'Confirm',
                            className: 'overlay-confirm',
                            onClick: async (close) => {
                                close();
                                // Show loading overlay
                                const closeLoadingOverlay = openOverlay({
                                    content: '<div class="overlay-loading">Copying as input image...</div>',
                                    buttons: [],
                                    parent: imageItem
                                });
                                try {
                                    const imgElement = imageItem.querySelector('img') as HTMLImageElement;
                                    const imagePath = imgElement?.src;
                                    // Fetch the image as a blob
                                    const imageResponse = await fetch(imagePath);
                                    if (!imageResponse.ok) {
                                        throw new Error('Failed to fetch image from gallery');
                                    }
                                    const imageBlob = await imageResponse.blob();
                                    // Create form data for upload
                                    const formData = new FormData();
                                    formData.append('image', imageBlob, filename);
                                    // Upload to ComfyUI
                                    const uploadResponse = await fetch('/comfyui/upload/image', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    const result = await uploadResponse.json();
                                    if (uploadResponse.ok) {
                                        closeLoadingOverlay();
                                        // No success overlay, just close
                                        return;
                                    } else {
                                        throw new Error(result.error || 'Upload failed');
                                    }
                                } catch (error) {
                                    console.error('Upload error:', error);
                                    closeLoadingOverlay();
                                    openOverlay({
                                        content: `<div class="overlay-error">Failed to copy image as input: ${error instanceof Error ? error.message : 'Unknown error'}</div>`,
                                        buttons: [
                                            {
                                                label: 'OK',
                                                className: 'overlay-cancel',
                                            }
                                        ],
                                        parent: imageItem
                                    });
                                }
                            }
                        }
                    ],
                    parent: imageItem
                });
            }
        });
    });

    // Add delete handlers for delete buttons
    const deleteButtons = document.querySelectorAll('.delete-button');
    
    deleteButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const deleteButton = button as HTMLButtonElement;
            const filename = deleteButton.dataset.filename;
            const subfolder = deleteButton.dataset.subfolder;
            
            if (!filename) {
                console.error('No filename found for delete button');
                return;
            }
            
            const imageItem = deleteButton.closest('.image-item') as HTMLElement;
            if (imageItem) {
                // Show generic overlay for confirmation
                openOverlay({
                    content: 'Are you sure you want to delete?',
                    buttons: [
                        {
                            label: 'Cancel',
                            className: 'overlay-cancel',
                        },
                        {
                            label: 'Delete',
                            className: 'overlay-confirm',
                            onClick: async (close) => {
                                try {
                                    const response = await fetch('/gallery/delete', {
                                        method: 'DELETE',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            filename: filename,
                                            subfolder: subfolder || ''
                                        })
                                    });
                                    const result = await response.json();
                                    if (response.ok) {
                                        // Remove the image item from the DOM
                                        imageItem.remove();
                                    } else {
                                        // Show error overlay
                                        openOverlay({
                                            content: `<div class='overlay-error'>Error deleting file: ${result.error}</div>`,
                                            buttons: [
                                                {
                                                    label: 'Dismiss',
                                                    className: 'overlay-cancel',
                                                }
                                            ],
                                            parent: imageItem
                                        });
                                    }
                                } catch (error) {
                                    openOverlay({
                                        content: `<div class='overlay-error'>Failed to delete file. Please try again.</div>`,
                                        buttons: [
                                            {
                                                label: 'Dismiss',
                                                className: 'overlay-cancel',
                                            }
                                        ],
                                        parent: imageItem
                                    });
                                }
                            }
                        }
                    ],
                    parent: imageItem
                });
            }
        });
    });
});


