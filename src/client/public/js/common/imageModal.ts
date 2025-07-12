/**
 * Opens an image modal with the specified image source and alt text
 * @param imageSrc - The source URL of the image to display
 * @param imageAlt - The alt text for the image (defaults to empty string)
 */
function openImageModal(imageSrc: string, imageAlt: string = ''): void {
    const modalHTML = `
        <div class="image-modal-container">
            <div class="image-modal-content">
                <button class="image-modal-close" aria-label="Close modal">&times;</button>
                <img src="${imageSrc}" alt="${imageAlt}" class="image-modal-image">
            </div>
        </div>
    `;

    // Insert the modal HTML into the document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get references to the created elements
    const modalContainer = document.querySelector('.image-modal-container') as HTMLDivElement;
    const closeButton = document.querySelector('.image-modal-close') as HTMLButtonElement;

    // Close modal when clicking the close button
    closeButton.addEventListener('click', closeImageModal);
    
    // Close modal when clicking outside the image
    modalContainer.addEventListener('click', (e: MouseEvent) => {
        if (e.target === modalContainer) {
            closeImageModal();
        }
    });

    // Close modal with Escape key
    const handleKeydown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    };
    document.addEventListener('keydown', handleKeydown);

    // Store the keydown handler reference for cleanup
    (modalContainer as any)._keydownHandler = handleKeydown;

    document.body.classList.add('locked');
}

/**
 * Closes the image modal and cleans up event listeners
 */
function closeImageModal(): void {
    document.body.classList.remove('locked');
    
    const modalContainer: HTMLDivElement | null = document.querySelector('.image-modal-container');
    if (modalContainer) {
        // Remove the keydown event listener to prevent memory leaks
        const keydownHandler = (modalContainer as any)._keydownHandler;
        if (keydownHandler) {
            document.removeEventListener('keydown', keydownHandler);
        }
        
        modalContainer.remove();
    }
}

export { openImageModal, closeImageModal }; 