interface InputImageData {
    filename: string;
    path: string;
    isVideo: boolean;
    time: number;
    timeText: string;
}

interface InputImagesPageData {
    currentSubfolder: string;
    parentSubfolder: string | null;
    scanned: {
        subfolders: string[];
        images: InputImageData[];
    };
    pageInfo: {
        prevPage: number;
        currentPage: number;
        nextPage: number;
        totalPages: number;
    };
    error: string | null;
}

interface InputImagesModalOptions {
    onImageSelect?: (filename: string, subfolder: string) => void;
    onCancel?: () => void;
}

/**
 * Opens a modal with input images for selection
 * @param options Configuration options for the modal
 */
export async function openInputImagesModal(options: InputImagesModalOptions = {}): Promise<void> {
    const { onImageSelect, onCancel } = options;

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'input-images-modal-container';
    modalContainer.innerHTML = `
        <div class="input-images-modal-content">
            <div class="input-images-modal-header">
                <h2>Select Input Image</h2>
                <button class="input-images-modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="input-images-modal-body">
                <div class="input-images-subfolders"></div>
                <div class="input-images-grid"></div>
                <div class="input-images-pagination"></div>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.appendChild(modalContainer);
    document.body.classList.add('locked');

    // Get references to elements
    const closeButton = modalContainer.querySelector('.input-images-modal-close') as HTMLButtonElement;
    const subfoldersContainer = modalContainer.querySelector('.input-images-subfolders') as HTMLDivElement;
    const imagesGrid = modalContainer.querySelector('.input-images-grid') as HTMLDivElement;
    const paginationContainer = modalContainer.querySelector('.input-images-pagination') as HTMLDivElement;

    let currentSubfolder = '';

    // Load input images data
    async function loadInputImages(subfolder: string = '', page: number = 0): Promise<void> {
        try {
            const url = `/api/input-images/${subfolder}?page=${page}&itemsPerPage=20`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load input images: ${response.statusText}`);
            }

            const data: InputImagesPageData = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            currentSubfolder = data.currentSubfolder;

            // Render subfolders
            renderSubfolders(data.scanned.subfolders, data.currentSubfolder, data.parentSubfolder);

            // Render images
            renderImages(data.scanned.images);

            // Render pagination
            renderPagination(data.pageInfo);

        } catch (error) {
            console.error('Error loading input images:', error);
            imagesGrid.innerHTML = `
                <div class="input-images-error">
                    <p>Failed to load input images: ${error instanceof Error ? error.message : 'Unknown error'}</p>
                </div>
            `;
        }
    }

    // Render subfolders navigation
    function renderSubfolders(subfolders: string[], currentSubfolder: string, parentSubfolder: string | null): void {
        let html = '<div class="input-images-subfolders-list">';
        
        if (currentSubfolder && currentSubfolder !== '') {
            html += '<a href="#" class="subfolder-link" data-subfolder="">(Default)</a>';
        }
        
        if (parentSubfolder !== null) {
            html += `<a href="#" class="subfolder-link" data-subfolder="${parentSubfolder}">..</a>`;
        }
        
        for (const subfolder of subfolders) {
            html += `<a href="#" class="subfolder-link" data-subfolder="${subfolder}">${subfolder}</a>`;
        }
        
        html += '</div>';
        subfoldersContainer.innerHTML = html;

        // Add click handlers for subfolder links
        subfoldersContainer.querySelectorAll('.subfolder-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const subfolder = (e.target as HTMLAnchorElement).getAttribute('data-subfolder') || '';
                loadInputImages(subfolder, 0);
            });
        });
    }

    // Render images grid
    function renderImages(images: InputImageData[]): void {
        if (images.length === 0) {
            imagesGrid.innerHTML = '<div class="input-images-empty">No images found in this folder.</div>';
            return;
        }

        let html = '';
        for (const image of images) {
            if (image.isVideo) continue; // Skip videos for image selection
            
            html += `
                <div class="input-images-item" data-filename="${image.filename}" data-subfolder="${currentSubfolder}">
                    <img src="${image.path}" alt="${image.filename}" class="input-images-thumbnail">
                    <div class="input-images-item-info">
                        <span class="input-images-filename">${image.filename}</span>
                        <span class="input-images-time">${image.timeText}</span>
                    </div>
                </div>
            `;
        }
        
        imagesGrid.innerHTML = html;

        // Add click handlers for image selection
        imagesGrid.querySelectorAll('.input-images-item').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.getAttribute('data-filename') || '';
                const subfolder = item.getAttribute('data-subfolder') || '';
                
                if (onImageSelect) {
                    onImageSelect(filename, subfolder);
                }
                
                closeModal();
            });
        });
    }

    // Render pagination
    function renderPagination(pageInfo: InputImagesPageData['pageInfo']): void {
        const { prevPage, currentPage, nextPage, totalPages } = pageInfo;
        
        let html = '<div class="input-images-pagination-controls">';
        
        // First page
        html += `<a href="#" class="pagination-button" data-page="0"><span class="icon arrow-double-left"></span></a>`;
        
        // Previous page
        html += `<a href="#" class="pagination-button" data-page="${prevPage}"><span class="icon arrow-left"></span></a>`;
        
        // Current page indicator
        html += `<span class="pagination-info">Page ${currentPage + 1} of ${totalPages + 1}</span>`;
        
        // Next page
        html += `<a href="#" class="pagination-button" data-page="${nextPage}"><span class="icon arrow-right"></span></a>`;
        
        // Last page
        html += `<a href="#" class="pagination-button" data-page="${totalPages}"><span class="icon arrow-double-right"></span></a>`;
        
        html += '</div>';
        paginationContainer.innerHTML = html;

        // Add click handlers for pagination
        paginationContainer.querySelectorAll('.pagination-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt((e.target as HTMLAnchorElement).getAttribute('data-page') || '0');
                loadInputImages(currentSubfolder, page);
            });
        });
    }

    // Close modal function
    function closeModal(): void {
        document.body.classList.remove('locked');
        modalContainer.remove();
        
        if (onCancel) {
            onCancel();
        }
    }

    // Event listeners
    closeButton.addEventListener('click', closeModal);
    
    modalContainer.addEventListener('click', (e: MouseEvent) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });

    // Close with Escape key
    const handleKeydown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };
    document.addEventListener('keydown', handleKeydown);

    // Store the keydown handler reference for cleanup
    (modalContainer as any)._keydownHandler = handleKeydown;

    // Load initial data
    await loadInputImages();
} 