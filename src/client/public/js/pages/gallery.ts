import { updateNavigationButtons } from '../common/galleryNavigation.js';
import { addMediaClickHandlers } from '../common/mediaDisplay.js';

const pageInput = document.getElementById('page-input') as HTMLInputElement;

// Get page information from DOM data attributes
const currentPage = parseInt(document.body.getAttribute('data-current-page') || '0', 10);
const totalPages = parseInt(document.body.getAttribute('data-total-pages') || '0', 10);
const galleryType = document.body.getAttribute('data-gallery-type') || 'output';

// Handle error display more gracefully
if (document.body.hasAttribute('data-error')) {
    const error = document.body.getAttribute('data-error');
    const mainContainer = document.querySelector('.main-container');
    
    if (mainContainer && error) {
        // Create a user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <div class="error-message">
                <h2>${galleryType === 'input' ? 'Input Images' : 'Gallery'} Unavailable</h2>
                <p>${error}</p>
                <p>Please check your configuration file and ensure the <code>${galleryType === 'input' ? 'input_dir' : 'output_dir'}</code> setting points to a valid directory.</p>
                <a href="/" class="settings-link">Go Home</a>
            </div>
        `;
        
        // Clear the main container and show the error
        mainContainer.innerHTML = '';
        mainContainer.appendChild(errorContainer);
    }
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
    const hasDeleteButtons = document.querySelectorAll('.delete-button').length > 0;
    addMediaClickHandlers('.image-item', {
        enableUseAsInput: galleryType === 'output', // Only enable for output gallery
        enableDelete: hasDeleteButtons, // Only enable delete handlers if buttons exist (config enabled)
        deleteEndpoint: `/gallery/${galleryType}/delete`, // Use unified delete endpoint
        imageSelector: 'img'
    });
});


