function openImageModal(imageSrc: string, imageAlt: string = '') {
    const modalContainer = document.createElement('div');
    modalContainer.classList.add('image-modal-container');

    const modalContent = document.createElement('div');
    modalContent.classList.add('image-modal-content');

    const image = document.createElement('img');
    image.src = imageSrc;
    image.alt = imageAlt;
    image.classList.add('image-modal-image');

    const closeButton = document.createElement('button');
    closeButton.classList.add('image-modal-close');
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close modal');

    modalContent.appendChild(closeButton);
    modalContent.appendChild(image);
    modalContainer.appendChild(modalContent);

    // Close modal when clicking the close button
    closeButton.addEventListener('click', closeImageModal);
    
    // Close modal when clicking outside the image
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeImageModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });

    document.body.appendChild(modalContainer);
    document.body.classList.add('locked');
}



function closeImageModal() {
    document.body.classList.remove('locked');
    const modalContainer = document.querySelector('.image-modal-container');
    if (modalContainer) {
        modalContainer.remove();
    }
}

export { openImageModal, closeImageModal }; 