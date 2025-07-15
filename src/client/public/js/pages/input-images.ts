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

// Add click handlers to all images in the input images (videos don't need modal)
document.addEventListener('DOMContentLoaded', () => {
    // Update navigation buttons based on current page
    const imageItems = document.querySelectorAll('.image-item');
    updateNavigationButtons(currentPage, totalPages, imageItems);
    
    // Add click handlers for images using shared utility with input-images-specific options
    // Input images only has "Delete" buttons (no "Use as Input" since they're already input images)
    // Note: Input images uses server-rendered buttons, so the delete buttons are already conditionally rendered
    const hasDeleteButtons = document.querySelectorAll('.delete-button').length > 0;
    addMediaClickHandlers('.image-item', {
        enableUseAsInput: false, // These already are used as inputs
        enableDelete: hasDeleteButtons, // Only enable delete handlers if buttons exist (config enabled)
        imageSelector: 'img'
    });
}); 