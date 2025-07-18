import {
  toComfyUIUrlFromImage,
  toImageFromComfyUIUrl,
  toImageFromRelativeUrl,
  toRelativeFromImage,
  type Image,
  type ImageType
} from '../client/public/js/common/image';

describe('image', () => {
  describe('toComfyUIUrlFromImage', () => {
    it('should construct URL with filename and type only', () => {
      const image: Image = {
        filename: 'test.png',
        type: 'input'
      };
      
      const result = toComfyUIUrlFromImage(image);
      expect(result).toBe('/comfyui/image?filename=test.png&type=input');
    });

    it('should construct URL with filename, subfolder, and type', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: 'loras',
        type: 'output'
      };
      
      const result = toComfyUIUrlFromImage(image);
      expect(result).toBe('/comfyui/image?filename=test.png&subfolder=loras&type=output');
    });

    it('should handle empty subfolder', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: '',
        type: 'input'
      };
      
      const result = toComfyUIUrlFromImage(image);
      expect(result).toBe('/comfyui/image?filename=test.png&type=input');
    });

    it('should handle nested subfolders', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: 'folder1/folder2',
        type: 'input'
      };
      
      const result = toComfyUIUrlFromImage(image);
      expect(result).toBe('/comfyui/image?filename=test.png&subfolder=folder1/folder2&type=input');
    });
  });

  describe('toImageFromComfyUIUrl', () => {
    it('should parse URL with filename and type only', () => {
      const url = '/comfyui/image?filename=test.png&type=input';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: undefined,
        type: 'input'
      });
    });

    it('should parse URL with filename, subfolder, and type', () => {
      const url = '/comfyui/image?filename=test.png&subfolder=loras&type=output';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'loras',
        type: 'output'
      });
    });

    it('should handle URL without type parameter (defaults to input)', () => {
      const url = '/comfyui/image?filename=test.png&subfolder=loras';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'loras',
        type: 'input'
      });
    });

    it('should handle URL without subfolder parameter', () => {
      const url = '/comfyui/image?filename=test.png&type=output';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: undefined,
        type: 'output'
      });
    });

    it('should handle URL with empty subfolder parameter', () => {
      const url = '/comfyui/image?filename=test.png&subfolder=&type=input';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: undefined,
        type: 'input'
      });
    });

    it('should handle URL with nested subfolders', () => {
      const url = '/comfyui/image?filename=test.png&subfolder=folder1/folder2&type=input';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'folder1/folder2',
        type: 'input'
      });
    });

    it('should handle URL with encoded characters', () => {
      const url = '/comfyui/image?filename=test%20image.png&subfolder=my%20folder&type=output';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: 'test image.png',
        subfolder: 'my folder',
        type: 'output'
      });
    });

    it('should handle malformed URL using regex fallback', () => {
      const url = '/comfyui/image?filename=test.png&subfolder=loras&type=output';
      
      // Mock URL constructor to throw error
      const originalURL = global.URL;
      global.URL = jest.fn().mockImplementation(() => {
        throw new Error('Invalid URL');
      }) as any;
      
      const result = toImageFromComfyUIUrl(url);
      
      // Restore original URL
      global.URL = originalURL;
      
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'loras',
        type: 'output'
      });
    });

    it('should return default values for completely invalid URL', () => {
      const url = 'invalid-url';
      
      const result = toImageFromComfyUIUrl(url);
      expect(result).toEqual({
        filename: '',
        type: 'input'
      });
    });
  });

  describe('toImageFromRelativeUrl', () => {
    it('should parse simple filename with default type', () => {
      const relativeUrl = 'test.png';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: undefined,
        type: 'input'
      });
    });

    it('should parse filename with [output] suffix', () => {
      const relativeUrl = 'test.png [output]';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: undefined,
        type: 'output'
      });
    });

    it('should parse filename with [input] suffix', () => {
      const relativeUrl = 'test.png [input]';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: undefined,
        type: 'input'
      });
    });

    it('should parse filename with subfolder and [output] suffix', () => {
      const relativeUrl = 'loras/test.png [output]';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'loras',
        type: 'output'
      });
    });

    it('should parse filename with nested subfolder and [input] suffix', () => {
      const relativeUrl = 'folder1/folder2/test.png [input]';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'folder1/folder2',
        type: 'input'
      });
    });

    it('should parse filename with subfolder but no type suffix', () => {
      const relativeUrl = 'loras/test.png';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'loras',
        type: 'input'
      });
    });

    it('should use custom default type when no suffix is present', () => {
      const relativeUrl = 'test.png';
      
      const result = toImageFromRelativeUrl(relativeUrl, 'output');
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: undefined,
        type: 'output'
      });
    });

    it('should handle empty string', () => {
      const relativeUrl = '';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: '',
        type: 'input'
      });
    });

    it('should handle empty string with custom default type', () => {
      const relativeUrl = '';
      
      const result = toImageFromRelativeUrl(relativeUrl, 'output');
      expect(result).toEqual({
        filename: '',
        type: 'output'
      });
    });

    it('should handle filename with spaces', () => {
      const relativeUrl = 'my test image.png [output]';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'my test image.png',
        subfolder: undefined,
        type: 'output'
      });
    });

    it('should handle subfolder with spaces', () => {
      const relativeUrl = 'my folder/test.png [input]';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test.png',
        subfolder: 'my folder',
        type: 'input'
      });
    });

    it('should handle filename that ends with [output] but is not a suffix', () => {
      const relativeUrl = 'test [output].png';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test [output].png',
        subfolder: undefined,
        type: 'input'
      });
    });

    it('should handle filename that ends with [input] but is not a suffix', () => {
      const relativeUrl = 'test [input].png';
      
      const result = toImageFromRelativeUrl(relativeUrl);
      expect(result).toEqual({
        filename: 'test [input].png',
        subfolder: undefined,
        type: 'input'
      });
    });
  });

  describe('toRelativeFromImage', () => {
    it('should convert image to relative URL without type suffix', () => {
      const image: Image = {
        filename: 'test.png',
        type: 'input'
      };
      
      const result = toRelativeFromImage(image);
      expect(result).toBe('test.png');
    });

    it('should convert image with subfolder to relative URL without type suffix', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: 'loras',
        type: 'output'
      };
      
      const result = toRelativeFromImage(image);
      expect(result).toBe('loras/test.png');
    });

    it('should convert image with nested subfolder to relative URL without type suffix', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: 'folder1/folder2',
        type: 'input'
      };
      
      const result = toRelativeFromImage(image);
      expect(result).toBe('folder1/folder2/test.png');
    });

    it('should convert image to relative URL with type suffix when includeType is true', () => {
      const image: Image = {
        filename: 'test.png',
        type: 'output'
      };
      
      const result = toRelativeFromImage(image, true);
      expect(result).toBe('test.png [output]');
    });

    it('should convert image with subfolder to relative URL with type suffix when includeType is true', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: 'loras',
        type: 'input'
      };
      
      const result = toRelativeFromImage(image, true);
      expect(result).toBe('loras/test.png [input]');
    });

    it('should handle empty filename', () => {
      const image: Image = {
        filename: '',
        type: 'input'
      };
      
      const result = toRelativeFromImage(image);
      expect(result).toBe('');
    });

    it('should handle empty filename with type suffix', () => {
      const image: Image = {
        filename: '',
        type: 'output'
      };
      
      const result = toRelativeFromImage(image, true);
      expect(result).toBe('');
    });

    it('should handle filename with spaces', () => {
      const image: Image = {
        filename: 'my test image.png',
        type: 'input'
      };
      
      const result = toRelativeFromImage(image);
      expect(result).toBe('my test image.png');
    });

    it('should handle subfolder with spaces', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: 'my folder',
        type: 'output'
      };
      
      const result = toRelativeFromImage(image, true);
      expect(result).toBe('my folder/test.png [output]');
    });

    it('should handle empty subfolder', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: '',
        type: 'input'
      };
      
      const result = toRelativeFromImage(image);
      expect(result).toBe('test.png');
    });
  });

  describe('Image type', () => {
    it('should allow valid ImageType values', () => {
      const inputType: ImageType = 'input';
      const outputType: ImageType = 'output';
      
      expect(inputType).toBe('input');
      expect(outputType).toBe('output');
    });

    it('should allow valid Image interface properties', () => {
      const image: Image = {
        filename: 'test.png',
        subfolder: 'loras',
        type: 'input'
      };
      
      expect(image.filename).toBe('test.png');
      expect(image.subfolder).toBe('loras');
      expect(image.type).toBe('input');
    });

    it('should allow Image without subfolder', () => {
      const image: Image = {
        filename: 'test.png',
        type: 'output'
      };
      
      expect(image.filename).toBe('test.png');
      expect(image.subfolder).toBeUndefined();
      expect(image.type).toBe('output');
    });
  });
}); 