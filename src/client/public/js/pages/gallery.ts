import { openImageModal } from '../common/imageModal.js';
import { openOverlay } from '../common/overlay.js';

const pageInput = document.getElementById('page-input') as HTMLInputElement;

// Get page information from DOM data attributes
const currentPage = parseInt(document.body.getAttribute('data-current-page') || '0', 10);
const totalPages = parseInt(document.body.getAttribute('data-total-pages') || '0', 10);

if (document.body.hasAttribute('data-error')) {
    alert(document.body.getAttribute('data-error'));
}

pageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        window.location.href = `?page=${pageInput.value}`;
    }
});

// Function to disable/enable navigation buttons based on current page
function updateNavigationButtons() {
    const paginationButtons = document.querySelectorAll('.pagination-button') as NodeListOf<HTMLAnchorElement>;
    
    paginationButtons.forEach((button) => {
        const href = button.getAttribute('href');
        if (!href) return;
        
        // Check if this is a navigation button (not the page input)
        if (href.includes('page=')) {
            const pageMatch = href.match(/page=(\d+)/);
            if (pageMatch) {
                const targetPage = parseInt(pageMatch[1], 10);
                
                // Disable first page buttons (double-left and left) if on first page
                if ((targetPage === 0 || targetPage === currentPage - 1) && currentPage === 0) {
                    button.classList.add('disabled');
                }
                // Disable last page buttons (double-right and right) if on last page
                else if ((targetPage === totalPages || targetPage === currentPage + 1) && currentPage === totalPages) {
                    button.classList.add('disabled');
                }
                // Enable all other buttons
                else {
                    button.classList.remove('disabled');
                }
            }
        }
    });
}

// Add click handlers to all images in the gallery (videos don't need modal)
document.addEventListener('DOMContentLoaded', () => {
    // Update navigation buttons based on current page
    updateNavigationButtons();
    
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
