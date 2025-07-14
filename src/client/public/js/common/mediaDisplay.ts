// Import types from shared types
import { HistoryData, HistoryOutput, MediaItem } from '../../../../shared/types/History.js';
// Import imageModal functions for handling images only
import { openImageModal } from '../common/imageModal.js';
import { openOverlay } from '../common/overlay.js';

// Configuration interface for media display options
export interface MediaDisplayOptions {
    enableUseAsInput?: boolean;
    enableDelete?: boolean;
    containerClass?: string;
    itemClass?: string;
    imageSelector?: string;
    imgClass?: string;
    subfolder?: string; // For gallery items that have subfolder information
}

/**
 * Extracts media items (images and videos) from history data
 * @param historyData The history data from ComfyUI
 * @param promptId The prompt ID to extract media for
 * @returns Array of MediaItem objects
 */
export function extractMediaFromHistory(historyData: HistoryData, promptId: string): MediaItem[] {
    const mediaItems: MediaItem[] = [];
    
    if (historyData[promptId] && historyData[promptId].outputs) {
        Object.values(historyData[promptId].outputs).forEach((output: HistoryOutput) => {
            // Handle images
            if (output.images) {
                output.images.forEach((image: { filename: string; subfolder: string; type: string }) => {
                    const mediaUrl = `/comfyui/image?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                    mediaItems.push({
                        url: mediaUrl,
                        isVideo: false,
                        filename: image.filename
                    });
                });
            }
            
            // Handle videos
            if (output.videos) {
                output.videos.forEach((video: { filename: string; subfolder: string; type: string; format: string; frame_rate: number; fullpath: string }) => {
                    const mediaUrl = `/comfyui/image?filename=${video.filename}&subfolder=${video.subfolder}&type=${video.type}`;
                    mediaItems.push({
                        url: mediaUrl,
                        isVideo: true,
                        filename: video.filename
                    });
                });
            }
        });
    }
    
    return mediaItems;
}

/**
 * Fetches and extracts media items for a completed queue item
 * @param promptId The prompt ID to fetch media for
 * @returns Promise resolving to array of MediaItem objects
 */
export async function fetchMediaForCompletedItem(promptId: string): Promise<MediaItem[]> {
    try {
        const response = await fetch(`/comfyui/history/${promptId}`);
        if (!response.ok) {
            return [];
        }
        
        const historyData: HistoryData = await response.json();
        return extractMediaFromHistory(historyData, promptId);
    } catch (error) {
        console.error('Error fetching history for completed item:', error);
        return [];
    }
}

/**
 * Creates HTML for a collection of media items with optional action buttons
 * @param mediaItems Array of MediaItem objects
 * @param options Configuration options for media display
 * @returns HTML string for the media items
 */
export function createMediaItemsHtml(mediaItems: MediaItem[], options: MediaDisplayOptions = {}): string {
    const {
        enableUseAsInput = false,
        enableDelete = false,
        containerClass = 'queue-item-images',
        itemClass = 'image-item', // always use unified class
        subfolder = ''
    } = options;

    if (mediaItems.length === 0) {
        return '';
    }
    
    return `
        <div class="${containerClass}">
            ${mediaItems.map((item: MediaItem) => {
                const actionButtons = [];
                
                // Add "Use as Input" button for images only (not videos)
                if (enableUseAsInput && !item.isVideo) {
                    actionButtons.push(`
                        <button class="use-as-input-button" data-filename="${item.filename}" data-subfolder="${subfolder}" title="Use as workflow input">
                            📥
                        </button>
                    `);
                }
                
                // Add "Delete" button if enabled
                if (enableDelete) {
                    actionButtons.push(`
                        <button class="delete-button" data-filename="${item.filename}" data-subfolder="${subfolder}">🗑️</button>
                    `);
                }
                
                const actionsHtml = actionButtons.length > 0 ? `
                    <div class="image-actions">
                        ${actionButtons.join('')}
                    </div>
                ` : '';

                if (item.isVideo) {
                    return `
                        <div class="${itemClass}" data-filename="${item.filename}" data-subfolder="${subfolder}">
                            ${actionsHtml}
                            <video src="${item.url}" alt="Generated video" style="cursor: pointer;">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                } else {
                    return `
                        <div class="${itemClass}" data-filename="${item.filename}" data-subfolder="${subfolder}">
                            ${actionsHtml}
                            <img src="${item.url}" alt="Generated image" style="cursor: pointer;">
                        </div>
                    `;
                }
            }).join('')}
        </div>
    `;
}

/**
 * Creates HTML for a single media item (for previous outputs) with optional action buttons
 * @param mediaItem The MediaItem to create HTML for
 * @param options Configuration options for media display
 * @returns HTML string for the media item
 */
export function createSingleMediaItemHtml(mediaItem: MediaItem, options: MediaDisplayOptions = {}): string {
    const {
        enableUseAsInput = false,
        enableDelete = false,
        itemClass = 'image-item', // always use unified class
        imgClass = 'previous-output-img'
    } = options;

    const actionButtons = [];
    
    // Add "Use as Input" button for images only (not videos)
    if (enableUseAsInput && !mediaItem.isVideo) {
        actionButtons.push(`
            <button class="use-as-input-button" data-filename="${mediaItem.filename}" title="Use as workflow input">
                📥
            </button>
        `);
    }
    
    // Add "Delete" button if enabled
    if (enableDelete) {
        actionButtons.push(`
            <button class="delete-button" data-filename="${mediaItem.filename}">🗑️</button>
        `);
    }
    
    const actionsHtml = actionButtons.length > 0 ? `
        <div class="image-actions">
            ${actionButtons.join('')}
        </div>
    ` : '';

    if (mediaItem.isVideo) {
        return `
            <div class="${itemClass}" data-filename="${mediaItem.filename}">
                ${actionsHtml}
                <a href="${mediaItem.url}" target="_blank">
                    <video src="${mediaItem.url}" alt="Previously generated video" class="${imgClass}" loading="lazy" controls>
                        Your browser does not support the video tag.
                    </video>
                </a>
            </div>
        `;
    } else {
        return `
            <div class="${itemClass}" data-filename="${mediaItem.filename}">
                ${actionsHtml}
                <a href="${mediaItem.url}" target="_blank">
                    <img src="${mediaItem.url}" alt="Previously generated image" class="${imgClass}" loading="lazy">
                </a>
            </div>
        `;
    }
}

/**
 * Adds click handlers to all images in a container and sets up action buttons
 * @param containerSelector CSS selector for the container with images
 * @param options Configuration options for media display
 */
export function addMediaClickHandlers(containerSelector: string, options: MediaDisplayOptions = {}): void {
    const {
        enableUseAsInput = false,
        enableDelete = false,
        imageSelector = 'img'
    } = options;

    // Add click handlers for images
    const images = document.querySelectorAll(`${containerSelector} ${imageSelector}`);
    
    images.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        imageElement.style.cursor = 'pointer';
        imageElement.addEventListener('click', (e) => {
            e.preventDefault();
            const imageSrc = imageElement.src;
            const imageAlt = imageElement.alt || 'Image';
            openImageModal(imageSrc, imageAlt);
        });
    });

    // Add "Use as Input" handlers
    if (enableUseAsInput) {
        const useAsInputButtons = document.querySelectorAll(`${containerSelector} .use-as-input-button`);
        
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
    }

    // Add delete handlers for delete buttons
    if (enableDelete) {
        const deleteButtons = document.querySelectorAll(`${containerSelector} .delete-button`);
        
        deleteButtons.forEach((button) => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const deleteButton = button as HTMLButtonElement;
                const filename = deleteButton.dataset.filename;
                const subfolder = deleteButton.dataset.subfolder || '';
                
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
                                onClick: async (_close) => {
                                    try {
                                        const response = await fetch('/gallery/delete', {
                                            method: 'DELETE',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                filename: filename,
                                                subfolder: subfolder
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
                                    } catch (_error) {
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
    }
} 