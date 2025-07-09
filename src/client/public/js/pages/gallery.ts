import { openImageModal } from '../common/imageModal.js';

const pageInput = document.getElementById('page-input') as HTMLInputElement;

if (document.body.hasAttribute('data-error')) {
    alert(document.body.getAttribute('data-error'));
}

pageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        window.location.href = `?page=${pageInput.value}`;
    }
});

// Add click handlers to all images in the gallery (videos don't need modal)
document.addEventListener('DOMContentLoaded', () => {
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
});
