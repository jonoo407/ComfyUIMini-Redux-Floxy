import { openInputImagesModal } from '../client/public/js/common/inputImagesModal';

// Mock fetch
global.fetch = jest.fn();

describe('Input Images Modal', () => {
    beforeEach(() => {
        // Clear DOM before each test
        document.body.innerHTML = '';
        // Reset body classes
        document.body.classList.remove('locked');
        // Reset fetch mock
        (fetch as jest.Mock).mockClear();
    });

    afterEach(() => {
        // Clean up after each test
        document.body.innerHTML = '';
        document.body.classList.remove('locked');
    });

    describe('openInputImagesModal', () => {
        it('should create modal with correct HTML structure', async () => {
            // Mock successful API response
            const mockResponse = {
                currentSubfolder: '',
                parentSubfolder: null,
                scanned: {
                    subfolders: ['folder1', 'folder2'],
                    images: [
                        {
                            filename: 'test1.jpg',
                            path: '/comfyui/image?filename=test1.jpg&subfolder=&type=input',
                            isVideo: false,
                            time: 1234567890,
                            timeText: '2 hours ago'
                        }
                    ]
                },
                pageInfo: {
                    prevPage: 0,
                    currentPage: 0,
                    nextPage: 1,
                    totalPages: 2
                },
                error: null
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await openInputImagesModal();

            const modalContainer = document.querySelector('.input-images-modal-container');
            const modalContent = document.querySelector('.input-images-modal-content');
            const modalHeader = document.querySelector('.input-images-modal-header');
            const closeButton = document.querySelector('.input-images-modal-close');

            expect(modalContainer).toBeInTheDocument();
            expect(modalContent).toBeInTheDocument();
            expect(modalHeader).toBeInTheDocument();
            expect(closeButton).toBeInTheDocument();
            expect(document.body.classList.contains('locked')).toBe(true);
        });

        it('should handle API error gracefully', async () => {
            // Mock API error
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error'
            });

            await openInputImagesModal();

            const errorElement = document.querySelector('.input-images-error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement?.textContent).toContain('Failed to load input images');
        });

        it('should call onImageSelect callback when image is clicked', async () => {
            const mockOnImageSelect = jest.fn();
            
            const mockResponse = {
                currentSubfolder: '',
                parentSubfolder: null,
                scanned: {
                    subfolders: [],
                    images: [
                        {
                            filename: 'test.jpg',
                            path: '/comfyui/image?filename=test.jpg&subfolder=&type=input',
                            isVideo: false,
                            time: 1234567890,
                            timeText: '1 hour ago'
                        }
                    ]
                },
                pageInfo: {
                    prevPage: 0,
                    currentPage: 0,
                    nextPage: 0,
                    totalPages: 0
                },
                error: null
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await openInputImagesModal({ onImageSelect: mockOnImageSelect });

            const imageItem = document.querySelector('.input-images-item');
            expect(imageItem).toBeInTheDocument();

            // Simulate click on image
            imageItem?.dispatchEvent(new Event('click'));

            expect(mockOnImageSelect).toHaveBeenCalledWith('test.jpg', '');
        });

        it('should close modal when close button is clicked', async () => {
            const mockResponse = {
                currentSubfolder: '',
                parentSubfolder: null,
                scanned: { subfolders: [], images: [] },
                pageInfo: { prevPage: 0, currentPage: 0, nextPage: 0, totalPages: 0 },
                error: null
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await openInputImagesModal();

            const closeButton = document.querySelector('.input-images-modal-close') as HTMLButtonElement;
            closeButton?.click();

            expect(document.querySelector('.input-images-modal-container')).not.toBeInTheDocument();
            expect(document.body.classList.contains('locked')).toBe(false);
        });

        it('should close modal when clicking outside content', async () => {
            const mockResponse = {
                currentSubfolder: '',
                parentSubfolder: null,
                scanned: { subfolders: [], images: [] },
                pageInfo: { prevPage: 0, currentPage: 0, nextPage: 0, totalPages: 0 },
                error: null
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await openInputImagesModal();

            const modalContainer = document.querySelector('.input-images-modal-container') as HTMLDivElement;
            modalContainer?.click();

            expect(document.querySelector('.input-images-modal-container')).not.toBeInTheDocument();
            expect(document.body.classList.contains('locked')).toBe(false);
        });
    });
}); 