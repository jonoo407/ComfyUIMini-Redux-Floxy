// Import the actual function from galleryNavigation
import { updateNavigationButtons } from '../client/public/js/common/galleryNavigation';

describe('Gallery Page Navigation Buttons', () => {
  let pageInput: HTMLInputElement;
  let paginationButtons: HTMLAnchorElement[];

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    
    // Set up page data attributes
    document.body.setAttribute('data-current-page', '1');
    document.body.setAttribute('data-total-pages', '5');
    
    // Create page input
    pageInput = document.createElement('input');
    pageInput.id = 'page-input';
    pageInput.type = 'text';
    document.body.appendChild(pageInput);
    
    // Create pagination buttons with correct href values
    paginationButtons = [
      createPaginationButton('First', '?page=0'),
      createPaginationButton('Previous', '?page=0'), // This will be updated in tests based on current page
      createPaginationButton('Next', '?page=2'),
      createPaginationButton('Last', '?page=5'),
    ];
    
    // Add buttons to DOM
    paginationButtons.forEach(button => {
      document.body.appendChild(button);
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Clear any existing disabled classes from buttons
    paginationButtons.forEach(button => {
      button.classList.remove('disabled');
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function createPaginationButton(text: string, href: string): HTMLAnchorElement {
    const button = document.createElement('a');
    button.className = 'pagination-button';
    button.href = href;
    button.textContent = text;
    return button;
  }

  function createImageItem(): HTMLElement {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    
    const img = document.createElement('img');
    img.src = 'test-image.jpg';
    img.alt = 'Test image';
    
    imageItem.appendChild(img);
    return imageItem;
  }

  describe('updateNavigationButtons', () => {
    it('should disable all navigation buttons when there are no images on the current page', () => {
      // Ensure no image items exist
      const imageItems = document.querySelectorAll('.image-item');
      expect(imageItems.length).toBe(0);
      
      // Call updateNavigationButtons directly
      updateNavigationButtons(1, 5, imageItems);
      
      // Check that all pagination buttons are disabled
      paginationButtons.forEach(button => {
        expect(button.classList.contains('disabled')).toBe(true);
      });
    });

    it('should enable navigation buttons when there are images on the current page', () => {
      // Add an image item to the page
      const imageItem = createImageItem();
      document.body.appendChild(imageItem);
      
      // Verify image item exists
      const imageItems = document.querySelectorAll('.image-item');
      expect(imageItems.length).toBe(1);
      
      // Call updateNavigationButtons directly
      updateNavigationButtons(1, 5, imageItems);
      
      // Check that pagination buttons are not disabled (except for edge cases)
      // On page 1, first and previous buttons should be enabled, next and last should be enabled
      expect(paginationButtons[0].classList.contains('disabled')).toBe(false); // First
      expect(paginationButtons[1].classList.contains('disabled')).toBe(false); // Previous
      expect(paginationButtons[2].classList.contains('disabled')).toBe(false); // Next
      expect(paginationButtons[3].classList.contains('disabled')).toBe(false); // Last
    });

    it('should handle multiple image items correctly', () => {
      // Add multiple image items
      const imageItem1 = createImageItem();
      const imageItem2 = createImageItem();
      document.body.appendChild(imageItem1);
      document.body.appendChild(imageItem2);
      
      // Verify image items exist
      const imageItems = document.querySelectorAll('.image-item');
      expect(imageItems.length).toBe(2);
      
      // Call updateNavigationButtons directly
      updateNavigationButtons(1, 5, imageItems);
      
      // Check that pagination buttons are not disabled (except for edge cases)
      expect(paginationButtons[0].classList.contains('disabled')).toBe(false); // First
      expect(paginationButtons[1].classList.contains('disabled')).toBe(false); // Previous
      expect(paginationButtons[2].classList.contains('disabled')).toBe(false); // Next
      expect(paginationButtons[3].classList.contains('disabled')).toBe(false); // Last
    });

    it('should handle edge case when on first page with images', () => {
      // Set current page to 0 (first page)
      document.body.setAttribute('data-current-page', '0');
      
      // Add an image item
      const imageItem = createImageItem();
      document.body.appendChild(imageItem);
      
      // Call updateNavigationButtons directly
      const imageItems = document.querySelectorAll('.image-item');
      updateNavigationButtons(0, 5, imageItems);
      
      // On first page, first and previous buttons should be disabled, next and last should be enabled
      expect(paginationButtons[0].classList.contains('disabled')).toBe(true); // First
      expect(paginationButtons[1].classList.contains('disabled')).toBe(true); // Previous
      expect(paginationButtons[2].classList.contains('disabled')).toBe(false); // Next
      expect(paginationButtons[3].classList.contains('disabled')).toBe(false); // Last
    });

    it('should handle edge case when on last page with images', () => {
      // Set current page to last page
      document.body.setAttribute('data-current-page', '5');
      
      // Update button hrefs to point to the correct pages for last page
      paginationButtons[1].href = '?page=4'; // Previous button
      paginationButtons[2].href = '?page=6'; // Next button
      
      // Add an image item
      const imageItem = createImageItem();
      document.body.appendChild(imageItem);
      
      // Call updateNavigationButtons directly
      const imageItems = document.querySelectorAll('.image-item');
      updateNavigationButtons(5, 5, imageItems);
      
      // On last page with images, first and previous buttons should be enabled, next should be disabled, last should be disabled
      expect(paginationButtons[0].classList.contains('disabled')).toBe(false); // First
      expect(paginationButtons[1].classList.contains('disabled')).toBe(false); // Previous
      expect(paginationButtons[2].classList.contains('disabled')).toBe(true); // Next
      expect(paginationButtons[3].classList.contains('disabled')).toBe(true); // Last
    });
  });
}); 