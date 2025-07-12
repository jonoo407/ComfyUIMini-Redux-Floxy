/**
 * Updates navigation buttons based on current page and image availability
 */
export function updateNavigationButtons(): void {
    const paginationButtons = document.querySelectorAll('.pagination-button') as NodeListOf<HTMLAnchorElement>;
    
    // Get page information from DOM data attributes
    const currentPage = parseInt(document.body.getAttribute('data-current-page') || '0', 10);
    const totalPages = parseInt(document.body.getAttribute('data-total-pages') || '0', 10);
    
    // Check if there are any images on the current page
    const imageItems = document.querySelectorAll('.image-item');
    const hasImages = imageItems.length > 0;
    
    // If there are no images, disable all navigation buttons
    if (!hasImages) {
        paginationButtons.forEach((button) => {
            button.classList.add('disabled');
        });
        return;
    }
    
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