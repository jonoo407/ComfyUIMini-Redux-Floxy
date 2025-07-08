import { openImageModal, openVideoModal } from '../common/imageModal.js';

const pageInput = document.getElementById('page-input') as HTMLInputElement;

if (document.body.hasAttribute('data-error')) {
    alert(document.body.getAttribute('data-error'));
}

pageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        window.location.href = `?page=${pageInput.value}`;
    }
});

// Add click handlers to all images and videos in the gallery
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.image-item img');
    const videos = document.querySelectorAll('.image-item video');
    
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
    
    videos.forEach((video) => {
        const videoElement = video as HTMLVideoElement;
        videoElement.style.cursor = 'pointer';
        videoElement.addEventListener('click', (e) => {
            e.preventDefault();
            const videoSrc = videoElement.src;
            openVideoModal(videoSrc);
        });
    });
});
