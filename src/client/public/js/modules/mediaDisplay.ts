// Import types from shared types
import { HistoryData, HistoryOutput, MediaItem } from '../../../../shared/types/History.js';
// Import imageModal functions for handling images only
import { openImageModal } from '../common/imageModal.js';

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
 * Creates HTML for a collection of media items
 * @param mediaItems Array of MediaItem objects
 * @param containerClass CSS class for the container (default: 'queue-item-images')
 * @param itemClass CSS class for individual items (default: 'image-item')
 * @returns HTML string for the media items
 */
export function createMediaItemsHtml(mediaItems: MediaItem[], containerClass: string = 'queue-item-images', itemClass: string = 'image-item'): string {
    if (mediaItems.length === 0) {
        return '';
    }
    
    return `
        <div class="${containerClass}">
            ${mediaItems.map((item: MediaItem) => {
                if (item.isVideo) {
                    return `
                        <div class="${itemClass}">
                            <video src="${item.url}" alt="Generated video" style="cursor: pointer;">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                } else {
                    return `
                        <div class="${itemClass}">
                            <img src="${item.url}" alt="Generated image" style="cursor: pointer;">
                        </div>
                    `;
                }
            }).join('')}
        </div>
    `;
}

/**
 * Creates HTML for a single media item (for previous outputs)
 * @param mediaItem The MediaItem to create HTML for
 * @param itemClass CSS class for the item (default: 'previous-output-item')
 * @param imgClass CSS class for the image (default: 'previous-output-img')
 * @returns HTML string for the media item
 */
export function createSingleMediaItemHtml(mediaItem: MediaItem, itemClass: string = 'previous-output-item', imgClass: string = 'previous-output-img'): string {
    if (mediaItem.isVideo) {
        return `
            <a href="${mediaItem.url}" target="_blank" class="${itemClass}">
                <video src="${mediaItem.url}" alt="Previously generated video" class="${imgClass}" loading="lazy" controls>
                    Your browser does not support the video tag.
                </video>
            </a>
        `;
    } else {
        return `
            <a href="${mediaItem.url}" target="_blank" class="${itemClass}">
                <img src="${mediaItem.url}" alt="Previously generated image" class="${imgClass}" loading="lazy">
            </a>
        `;
    }
}

/**
 * Adds click handlers to all images in a container (videos don't need modal)
 * @param containerSelector CSS selector for the container with images
 * @param imageSelector CSS selector for images within the container (default: 'img')
 */
export function addMediaClickHandlers(containerSelector: string, imageSelector: string = 'img'): void {
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
} 