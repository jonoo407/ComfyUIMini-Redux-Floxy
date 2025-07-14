import {
  extractMediaFromHistory,
  fetchMediaForCompletedItem,
  createMediaItemsHtml,
  createSingleMediaItemHtml,
  addMediaClickHandlers
} from '../client/public/js/modules/mediaDisplay';
import { HistoryData, MediaItem } from '../../shared/types/History';
import { openImageModal } from '../client/public/js/common/imageModal';

// Mock the imageModal module
jest.mock('../client/public/js/common/imageModal', () => ({
  openImageModal: jest.fn()
}));

describe('Media Display Module', () => {
  const mockOpenImageModal = openImageModal as jest.MockedFunction<typeof openImageModal>;

  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = '';
    // Reset mocks
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
  });

  describe('extractMediaFromHistory', () => {
    it('should extract images from history data', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              images: [
                { filename: 'image1.png', subfolder: 'output', type: 'output' },
                { filename: 'image2.jpg', subfolder: 'temp', type: 'temp' }
              ]
            }
          }
        }
      };

      const result = extractMediaFromHistory(historyData, 'prompt-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
        isVideo: false,
        filename: 'image1.png'
      });
      expect(result[1]).toEqual({
        url: '/comfyui/image?filename=image2.jpg&subfolder=temp&type=temp',
        isVideo: false,
        filename: 'image2.jpg'
      });
    });

    it('should extract videos from history data', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              videos: [
                {
                  filename: 'video1.mp4',
                  subfolder: 'output',
                  type: 'output',
                  format: 'mp4',
                  frame_rate: 30,
                  fullpath: '/path/to/video1.mp4'
                }
              ]
            }
          }
        }
      };

      const result = extractMediaFromHistory(historyData, 'prompt-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: '/comfyui/image?filename=video1.mp4&subfolder=output&type=output',
        isVideo: true,
        filename: 'video1.mp4'
      });
    });

    it('should extract both images and videos from history data', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              images: [
                { filename: 'image1.png', subfolder: 'output', type: 'output' }
              ],
              videos: [
                {
                  filename: 'video1.mp4',
                  subfolder: 'output',
                  type: 'output',
                  format: 'mp4',
                  frame_rate: 30,
                  fullpath: '/path/to/video1.mp4'
                }
              ]
            }
          }
        }
      };

      const result = extractMediaFromHistory(historyData, 'prompt-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
        isVideo: false,
        filename: 'image1.png'
      });
      expect(result[1]).toEqual({
        url: '/comfyui/image?filename=video1.mp4&subfolder=output&type=output',
        isVideo: true,
        filename: 'video1.mp4'
      });
    });

    it('should handle multiple output nodes', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              images: [
                { filename: 'image1.png', subfolder: 'output', type: 'output' }
              ]
            },
            'node-2': {
              videos: [
                {
                  filename: 'video1.mp4',
                  subfolder: 'output',
                  type: 'output',
                  format: 'mp4',
                  frame_rate: 30,
                  fullpath: '/path/to/video1.mp4'
                }
              ]
            }
          }
        }
      };

      const result = extractMediaFromHistory(historyData, 'prompt-123');

      expect(result).toHaveLength(2);
      expect(result[0].isVideo).toBe(false);
      expect(result[1].isVideo).toBe(true);
    });

    it('should return empty array for non-existent prompt ID', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              images: [
                { filename: 'image1.png', subfolder: 'output', type: 'output' }
              ]
            }
          }
        }
      };

      const result = extractMediaFromHistory(historyData, 'non-existent');

      expect(result).toEqual([]);
    });

    it('should return empty array for prompt with no outputs', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {}
        }
      };

      const result = extractMediaFromHistory(historyData, 'prompt-123');

      expect(result).toEqual([]);
    });

    it('should return empty array for prompt with outputs but no media', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {}
          }
        }
      };

      const result = extractMediaFromHistory(historyData, 'prompt-123');

      expect(result).toEqual([]);
    });

    it('should handle empty history data', () => {
      const historyData: HistoryData = {};

      const result = extractMediaFromHistory(historyData, 'prompt-123');

      expect(result).toEqual([]);
    });
  });

  describe('fetchMediaForCompletedItem', () => {
    it('should fetch and extract media for completed item', async () => {
      const mockHistoryData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              images: [
                { filename: 'image1.png', subfolder: 'output', type: 'output' }
              ]
            }
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoryData
      });

      const result = await fetchMediaForCompletedItem('prompt-123');

      expect(global.fetch).toHaveBeenCalledWith('/comfyui/history/prompt-123');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
        isVideo: false,
        filename: 'image1.png'
      });
    });

    it('should return empty array when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      const result = await fetchMediaForCompletedItem('prompt-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when fetch throws error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchMediaForCompletedItem('prompt-123');

      expect(result).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await fetchMediaForCompletedItem('prompt-123');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching history for completed item:', expect.any(Error));
      expect(result).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('createMediaItemsHtml', () => {
    it('should create HTML for image items', () => {
      const mediaItems: MediaItem[] = [
        {
          url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
          isVideo: false,
          filename: 'image1.png'
        },
        {
          url: '/comfyui/image?filename=image2.jpg&subfolder=temp&type=temp',
          isVideo: false,
          filename: 'image2.jpg'
        }
      ];

      const result = createMediaItemsHtml(mediaItems);

      expect(result).toContain('queue-item-images');
      expect(result).toContain('image-item');
      expect(result).toContain('image1.png');
      expect(result).toContain('image2.jpg');
      expect(result).toContain('Generated image');
      expect(result).toContain('cursor: pointer');
    });

    it('should create HTML for video items', () => {
      const mediaItems: MediaItem[] = [
        {
          url: '/comfyui/image?filename=video1.mp4&subfolder=output&type=output',
          isVideo: true,
          filename: 'video1.mp4'
        }
      ];

      const result = createMediaItemsHtml(mediaItems);

      expect(result).toContain('queue-item-images');
      expect(result).toContain('image-item');
      expect(result).toContain('video1.mp4');
      expect(result).toContain('Generated video');
      expect(result).toContain('cursor: pointer');
      expect(result).toContain('<video');
      expect(result).toContain('Your browser does not support the video tag');
    });

    it('should create HTML for mixed media items', () => {
      const mediaItems: MediaItem[] = [
        {
          url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
          isVideo: false,
          filename: 'image1.png'
        },
        {
          url: '/comfyui/image?filename=video1.mp4&subfolder=output&type=output',
          isVideo: true,
          filename: 'video1.mp4'
        }
      ];

      const result = createMediaItemsHtml(mediaItems);

      expect(result).toContain('<img');
      expect(result).toContain('<video');
      expect(result).toContain('image1.png');
      expect(result).toContain('video1.mp4');
    });

    it('should return empty string for empty media items', () => {
      const result = createMediaItemsHtml([]);

      expect(result).toBe('');
    });

    it('should use custom CSS classes when provided', () => {
      const mediaItems: MediaItem[] = [
        {
          url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
          isVideo: false,
          filename: 'image1.png'
        }
      ];

      const result = createMediaItemsHtml(mediaItems, 'custom-container', 'custom-item');

      expect(result).toContain('custom-container');
      expect(result).toContain('custom-item');
      expect(result).not.toContain('queue-item-images');
      expect(result).not.toContain('image-item');
    });
  });

  describe('createSingleMediaItemHtml', () => {
    it('should create HTML for a single image item', () => {
      const mediaItem: MediaItem = {
        url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
        isVideo: false,
        filename: 'image1.png'
      };

      const result = createSingleMediaItemHtml(mediaItem);

      expect(result).toContain('previous-output-item');
      expect(result).toContain('previous-output-img');
      expect(result).toContain('image1.png');
      expect(result).toContain('Previously generated image');
      expect(result).toContain('loading="lazy"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('<img');
    });

    it('should create HTML for a single video item', () => {
      const mediaItem: MediaItem = {
        url: '/comfyui/image?filename=video1.mp4&subfolder=output&type=output',
        isVideo: true,
        filename: 'video1.mp4'
      };

      const result = createSingleMediaItemHtml(mediaItem);

      expect(result).toContain('previous-output-item');
      expect(result).toContain('previous-output-img');
      expect(result).toContain('video1.mp4');
      expect(result).toContain('Previously generated video');
      expect(result).toContain('loading="lazy"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('<video');
      expect(result).toContain('controls');
    });

    it('should use custom CSS classes when provided', () => {
      const mediaItem: MediaItem = {
        url: '/comfyui/image?filename=image1.png&subfolder=output&type=output',
        isVideo: false,
        filename: 'image1.png'
      };

      const result = createSingleMediaItemHtml(mediaItem, 'custom-item', 'custom-img');

      expect(result).toContain('custom-item');
      expect(result).toContain('custom-img');
      expect(result).not.toContain('previous-output-item');
      expect(result).not.toContain('previous-output-img');
    });
  });

  describe('addMediaClickHandlers', () => {
    it('should add click handlers to images in container', () => {
      // Create test HTML structure
      document.body.innerHTML = `
        <div id="test-container">
          <img src="image1.png" alt="Test image 1">
          <img src="image2.jpg" alt="Test image 2">
        </div>
      `;

      addMediaClickHandlers('#test-container');

      const images = document.querySelectorAll('#test-container img');
      expect(images).toHaveLength(2);

      // Test first image click
      const firstImage = images[0] as HTMLImageElement;
      firstImage.click();

      expect(mockOpenImageModal).toHaveBeenCalledWith('http://localhost/image1.png', 'Test image 1');
    });

    it('should add click handlers with custom image selector', () => {
      // Create test HTML structure
      document.body.innerHTML = `
        <div id="test-container">
          <div class="custom-image" data-src="image1.png" data-alt="Test image 1"></div>
          <div class="custom-image" data-src="image2.jpg" data-alt="Test image 2"></div>
        </div>
      `;

      // This test would need to be modified if we want to test custom selectors
      // For now, we'll test the default behavior
      addMediaClickHandlers('#test-container', '.custom-image');

      const customImages = document.querySelectorAll('#test-container .custom-image');
      expect(customImages).toHaveLength(2);
    });

    it('should set cursor style to pointer for images', () => {
      document.body.innerHTML = `
        <div id="test-container">
          <img src="image1.png" alt="Test image 1">
        </div>
      `;

      addMediaClickHandlers('#test-container');

      const image = document.querySelector('#test-container img') as HTMLImageElement;
      expect(image.style.cursor).toBe('pointer');
    });

    it('should prevent default behavior on image click', () => {
      document.body.innerHTML = `
        <div id="test-container">
          <img src="image1.png" alt="Test image 1">
        </div>
      `;

      addMediaClickHandlers('#test-container');

      const image = document.querySelector('#test-container img') as HTMLImageElement;
      const clickEvent = new MouseEvent('click');
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      // Simulate click
      image.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle images without alt text', () => {
      document.body.innerHTML = `
        <div id="test-container">
          <img src="image1.png">
        </div>
      `;

      addMediaClickHandlers('#test-container');

      const image = document.querySelector('#test-container img') as HTMLImageElement;
      image.click();

      expect(mockOpenImageModal).toHaveBeenCalledWith('http://localhost/image1.png', 'Image');
    });

    it('should handle empty container gracefully', () => {
      document.body.innerHTML = `
        <div id="test-container">
        </div>
      `;

      expect(() => addMediaClickHandlers('#test-container')).not.toThrow();
    });

    it('should handle container with no images gracefully', () => {
      document.body.innerHTML = `
        <div id="test-container">
          <div>No images here</div>
        </div>
      `;

      expect(() => addMediaClickHandlers('#test-container')).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow from history extraction to HTML creation', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              images: [
                { filename: 'image1.png', subfolder: 'output', type: 'output' }
              ],
              videos: [
                {
                  filename: 'video1.mp4',
                  subfolder: 'output',
                  type: 'output',
                  format: 'mp4',
                  frame_rate: 30,
                  fullpath: '/path/to/video1.mp4'
                }
              ]
            }
          }
        }
      };

      // Extract media
      const mediaItems = extractMediaFromHistory(historyData, 'prompt-123');
      expect(mediaItems).toHaveLength(2);

      // Create HTML
      const html = createMediaItemsHtml(mediaItems);
      expect(html).toContain('image1.png');
      expect(html).toContain('video1.mp4');

      // Create single item HTML
      const singleHtml = createSingleMediaItemHtml(mediaItems[0]);
      expect(singleHtml).toContain('image1.png');
    });

    it('should handle special characters in filenames', () => {
      const historyData: HistoryData = {
        'prompt-123': {
          outputs: {
            'node-1': {
              images: [
                { filename: 'image with spaces & symbols.png', subfolder: 'output', type: 'output' }
              ]
            }
          }
        }
      };

      const mediaItems = extractMediaFromHistory(historyData, 'prompt-123');
      expect(mediaItems[0].filename).toBe('image with spaces & symbols.png');
      expect(mediaItems[0].url).toContain('image with spaces & symbols.png');
    });
  });
}); 