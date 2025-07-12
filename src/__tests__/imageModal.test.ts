import { openImageModal, closeImageModal } from '../client/public/js/common/imageModal';

describe('Image Modal', () => {
  const testImageSrc = 'test-image.jpg';
  const testImageAlt = 'Test image';

  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = '';
    // Reset body classes
    document.body.classList.remove('locked');
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
    document.body.classList.remove('locked');
  });

  describe('openImageModal', () => {
    it('should create modal with correct HTML structure', () => {
      openImageModal(testImageSrc, testImageAlt);

      const modalContainer = document.querySelector('.image-modal-container');
      const modalContent = document.querySelector('.image-modal-content');
      const closeButton = document.querySelector('.image-modal-close');
      const image = document.querySelector('.image-modal-image') as HTMLImageElement;

      expect(modalContainer).toBeInTheDocument();
      expect(modalContent).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
      expect(image).toBeInTheDocument();
      expect(image.src).toContain(testImageSrc);
      expect(image.alt).toBe(testImageAlt);
    });

    it('should add locked class to body', () => {
      openImageModal(testImageSrc, testImageAlt);

      expect(document.body.classList.contains('locked')).toBe(true);
    });

    it('should work with empty alt text', () => {
      openImageModal(testImageSrc);

      const image = document.querySelector('.image-modal-image') as HTMLImageElement;
      expect(image.alt).toBe('');
    });

    it('should add event listeners to close button', () => {
      openImageModal(testImageSrc, testImageAlt);

      const closeButton = document.querySelector('.image-modal-close') as HTMLButtonElement;
      expect(closeButton).toBeInTheDocument();

      // Simulate click on close button
      closeButton.click();

      // Modal should be removed
      expect(document.querySelector('.image-modal-container')).not.toBeInTheDocument();
      expect(document.body.classList.contains('locked')).toBe(false);
    });

    it('should add event listeners to modal container for outside clicks', () => {
      openImageModal(testImageSrc, testImageAlt);

      const modalContainer = document.querySelector('.image-modal-container') as HTMLDivElement;
      expect(modalContainer).toBeInTheDocument();

      // Simulate click on modal container (outside the image)
      modalContainer.click();

      // Modal should be removed
      expect(document.querySelector('.image-modal-container')).not.toBeInTheDocument();
      expect(document.body.classList.contains('locked')).toBe(false);
    });

    it('should not close when clicking on the image content', () => {
      openImageModal(testImageSrc, testImageAlt);

      const modalContent = document.querySelector('.image-modal-content') as HTMLDivElement;
      expect(modalContent).toBeInTheDocument();

      // Simulate click on modal content (not the container)
      modalContent.click();

      // Modal should still be present
      expect(document.querySelector('.image-modal-container')).toBeInTheDocument();
      expect(document.body.classList.contains('locked')).toBe(true);
    });

    it('should add escape key event listener', () => {
      openImageModal(testImageSrc, testImageAlt);

      // Simulate escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      // Modal should be removed
      expect(document.querySelector('.image-modal-container')).not.toBeInTheDocument();
      expect(document.body.classList.contains('locked')).toBe(false);
    });

    it('should not close on other key presses', () => {
      openImageModal(testImageSrc, testImageAlt);

      // Simulate other key press
      const otherKeyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(otherKeyEvent);

      // Modal should still be present
      expect(document.querySelector('.image-modal-container')).toBeInTheDocument();
      expect(document.body.classList.contains('locked')).toBe(true);
    });

    it('should store keydown handler reference for cleanup', () => {
      openImageModal(testImageSrc, testImageAlt);

      const modalContainer = document.querySelector('.image-modal-container') as HTMLDivElement;
      expect((modalContainer as any)._keydownHandler).toBeDefined();
      expect(typeof (modalContainer as any)._keydownHandler).toBe('function');
    });
  });

  describe('closeImageModal', () => {
    it('should remove modal from DOM', () => {
      openImageModal(testImageSrc, testImageAlt);
      expect(document.querySelector('.image-modal-container')).toBeInTheDocument();

      closeImageModal();

      expect(document.querySelector('.image-modal-container')).not.toBeInTheDocument();
    });

    it('should remove locked class from body', () => {
      openImageModal(testImageSrc, testImageAlt);
      expect(document.body.classList.contains('locked')).toBe(true);

      closeImageModal();

      expect(document.body.classList.contains('locked')).toBe(false);
    });

    it('should handle case when no modal exists', () => {
      // Should not throw error when no modal is present
      expect(() => closeImageModal()).not.toThrow();
    });

    it('should remove keydown event listener on close', () => {
      openImageModal(testImageSrc, testImageAlt);

      // Get the stored handler
      const modalContainer = document.querySelector('.image-modal-container') as HTMLDivElement;
      const keydownHandler = (modalContainer as any)._keydownHandler;

      // Mock removeEventListener to verify it's called
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      closeImageModal();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', keydownHandler);
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple modal opens and closes', () => {
      // Open first modal
      openImageModal('image1.jpg', 'Image 1');
      expect(document.querySelector('.image-modal-container')).toBeInTheDocument();

      // Close first modal
      closeImageModal();
      expect(document.querySelector('.image-modal-container')).not.toBeInTheDocument();

      // Open second modal
      openImageModal('image2.jpg', 'Image 2');
      expect(document.querySelector('.image-modal-container')).toBeInTheDocument();

      // Close second modal
      closeImageModal();
      expect(document.querySelector('.image-modal-container')).not.toBeInTheDocument();
    });

    it('should handle special characters in image src and alt', () => {
      const specialSrc = 'test-image-with-special-chars.jpg';
      const specialAlt = 'Test image with special chars & symbols';

      openImageModal(specialSrc, specialAlt);

      const image = document.querySelector('.image-modal-image') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toContain(specialSrc);
      expect(image.alt).toBe(specialAlt);

      // Verify no script tags were actually executed (DOM should be clean)
      const scripts = document.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });

    it('should handle rapid open/close operations', () => {
      // Rapidly open and close modal
      openImageModal(testImageSrc, testImageAlt);
      closeImageModal();
      openImageModal(testImageSrc, testImageAlt);
      closeImageModal();

      // Should end with no modal
      expect(document.querySelector('.image-modal-container')).not.toBeInTheDocument();
      expect(document.body.classList.contains('locked')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      openImageModal(testImageSrc, testImageAlt);

      const closeButton = document.querySelector('.image-modal-close') as HTMLButtonElement;
      expect(closeButton.getAttribute('aria-label')).toBe('Close modal');
    });

    it('should have proper image alt text', () => {
      openImageModal(testImageSrc, testImageAlt);

      const image = document.querySelector('.image-modal-image') as HTMLImageElement;
      expect(image.alt).toBe(testImageAlt);
    });
  });
}); 