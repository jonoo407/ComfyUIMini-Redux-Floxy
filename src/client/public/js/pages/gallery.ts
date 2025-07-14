import { updateNavigationButtons } from '../common/galleryNavigation.js';
import { addMediaClickHandlers } from '../common/mediaDisplay.js';

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
    
    // Add click handlers for images using shared utility with gallery-specific options
    // Gallery has both "Use as Input" and "Delete" buttons enabled (if delete is enabled in config)
    // Note: Gallery uses server-rendered buttons, so the delete buttons are already conditionally rendered
    const hasDeleteButtons = document.querySelectorAll('.delete-button').length > 0;
    addMediaClickHandlers('.image-item', {
        enableUseAsInput: true,
        enableDelete: hasDeleteButtons, // Only enable delete handlers if buttons exist (config enabled)
        imageSelector: 'img'
    });
});


