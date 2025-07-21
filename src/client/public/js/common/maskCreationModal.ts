import { Image, toComfyUIUrlFromImage } from './image.js';

export interface MaskCreationModalOptions {
    image: Image;
    maskImage?: Image;
    onMaskCreated?: (filename: string) => void;
    onCancel?: () => void;
}

export interface MaskCreationModalElements {
    closeBtn: HTMLButtonElement;
    cancelBtn: HTMLButtonElement;
    saveBtn: HTMLButtonElement;
    brushBtn: HTMLButtonElement;
    eraserBtn: HTMLButtonElement;
    clearBtn: HTMLButtonElement;
    brushSizeInput: HTMLInputElement;
    canvas: HTMLCanvasElement;
    modal: HTMLDivElement;
}

export interface MaskCreationModalState {
    isDrawing: boolean;
    lastX: number;
    lastY: number;
    brushSize: number;
    tool: 'brush' | 'eraser';
    img: HTMLImageElement | null;
    maskLayer: HTMLCanvasElement | null;
    maskCtx: CanvasRenderingContext2D | null;
    ctx: CanvasRenderingContext2D | null;
    imageInfo: Image | null;
    scale?: number;
    originalWidth?: number;
    originalHeight?: number;
}

export function openMaskCreationModal(options: MaskCreationModalOptions) {
    const { image, maskImage, onMaskCreated: _onMaskCreated, onCancel } = options;
    
    // Create modal structure
    const modal = createModalStructure();
    document.body.appendChild(modal);
    document.body.classList.add('locked');
    
    // Get DOM elements
    const elements = getModalElements(modal);
    
    // Initialize state
    const state = initializeState();
    
    // Store the image information in state
    state.imageInfo = image;
    
    // Set up event listeners
    setupEventListeners(elements, state, options);
    
    // Load the base image - construct URL from Image object
    const imageUrl = toComfyUIUrlFromImage(image);
    const maskUrl = maskImage ? toComfyUIUrlFromImage(maskImage) : undefined;
    loadBaseImage(imageUrl, elements, state, maskUrl);
    
    return { close: () => closeModal(modal, onCancel) };
}



function createModalStructure(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'mask-creation-modal-container';
    modal.innerHTML = `
        <div class="mask-creation-modal-content">
            <div class="mask-creation-modal-header">
                <h2>Create Mask</h2>
                <button class="mask-creation-modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="mask-creation-modal-body">
                <div class="mask-creation-controls">
                    <label>Brush Size: <input type="range" min="1" max="100" value="20" id="mask-brush-size"></label>
                    <button id="mask-tool-brush" class="tool-button active" data-tool="brush">Brush</button>
                    <button id="mask-tool-eraser" class="tool-button" data-tool="eraser">Eraser</button>
                    <button id="mask-clear" class="tool-button">Clear</button>
                </div>
                <div class="mask-canvas-container">
                    <canvas id="mask-canvas"></canvas>
                </div>
                <div class="mask-instructions">
                    <p>Draw on the image to create a mask.</p>
                </div>
            </div>
            <div class="mask-creation-modal-footer">
                <button class="mask-creation-cancel">Cancel</button>
                <button class="mask-creation-save">Save Mask</button>
            </div>
        </div>
    `;
    return modal;
}

function getModalElements(modal: HTMLDivElement): MaskCreationModalElements {
    return {
        closeBtn: modal.querySelector('.mask-creation-modal-close') as HTMLButtonElement,
        cancelBtn: modal.querySelector('.mask-creation-cancel') as HTMLButtonElement,
        saveBtn: modal.querySelector('.mask-creation-save') as HTMLButtonElement,
        brushBtn: modal.querySelector('#mask-tool-brush') as HTMLButtonElement,
        eraserBtn: modal.querySelector('#mask-tool-eraser') as HTMLButtonElement,
        clearBtn: modal.querySelector('#mask-clear') as HTMLButtonElement,
        brushSizeInput: modal.querySelector('#mask-brush-size') as HTMLInputElement,
        canvas: modal.querySelector('#mask-canvas') as HTMLCanvasElement,
        modal
    };
}

function initializeState(): MaskCreationModalState {
    return {
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        brushSize: 20,
        tool: 'brush',
        img: null,
        maskLayer: null,
        maskCtx: null,
        ctx: null,
        imageInfo: null
    };
}

function setupEventListeners(
    elements: MaskCreationModalElements,
    state: MaskCreationModalState,
    options: MaskCreationModalOptions
) {
    const { canvas, closeBtn, cancelBtn, saveBtn, brushBtn, eraserBtn, clearBtn, brushSizeInput } = elements;
    
    // Canvas drawing events - Mouse
    canvas.addEventListener('mousedown', (e: MouseEvent) => handlePointerDown(e, state, canvas));
    canvas.addEventListener('mousemove', (e: MouseEvent) => handlePointerMove(e, state, canvas));
    canvas.addEventListener('mouseup', () => handlePointerUp(state));
    canvas.addEventListener('mouseleave', () => handlePointerUp(state));
    
    // Canvas drawing events - Touch (for mobile)
    canvas.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            handlePointerDown(e.touches[0], state, canvas);
        }
    });
    canvas.addEventListener('touchmove', (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            handlePointerMove(e.touches[0], state, canvas);
        }
    });
    canvas.addEventListener('touchend', (e: TouchEvent) => {
        e.preventDefault();
        handlePointerUp(state);
    });
    
    // Control buttons
    brushBtn.onclick = () => setTool('brush', brushBtn, eraserBtn, state);
    eraserBtn.onclick = () => setTool('eraser', brushBtn, eraserBtn, state);
    brushSizeInput.oninput = () => setBrushSize(brushSizeInput, state);
    clearBtn.onclick = () => clearMask(state);
    
    // Modal controls
    closeBtn.onclick = () => closeModal(elements.modal, options.onCancel);
    cancelBtn.onclick = () => closeModal(elements.modal, options.onCancel);
    saveBtn.onclick = () => saveMask(state, options, elements.modal);
    
    // Add touch event handlers for mobile
    saveBtn.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        saveMask(state, options, elements.modal);
    });
    
    cancelBtn.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        closeModal(elements.modal, options.onCancel);
    });
    
    // Escape key
    const esc = (e: KeyboardEvent) => { 
        if (e.key === 'Escape') closeModal(elements.modal, options.onCancel); 
    };
    document.addEventListener('keydown', esc);
    
    // Window resize handler
    const handleResize = () => {
        if (state.img && elements.canvas) {
            setupCanvas(state.img, elements.canvas, state);
            drawPreview(state);
        }
    };
    window.addEventListener('resize', handleResize);
    
    elements.modal.addEventListener('remove', () => {
        document.removeEventListener('keydown', esc);
        window.removeEventListener('resize', handleResize);
    });
}

function loadBaseImage(
    imageSrc: string,
    elements: MaskCreationModalElements,
    state: MaskCreationModalState,
    maskSrc?: string
) {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
        // Wait for the modal to be fully rendered by checking container dimensions
        const waitForContainer = () => {
            const container = elements.canvas.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setupCanvas(img, elements.canvas, state);
                    if (maskSrc) {
                        loadExistingMask(maskSrc, state);
                    } else {
                        drawPreview(state);
                    }
                } else {
                    // Container not ready yet, try again
                    requestAnimationFrame(waitForContainer);
                }
            } else {
                // Fallback if container not found
                setupCanvas(img, elements.canvas, state);
                if (maskSrc) {
                    loadExistingMask(maskSrc, state);
                } else {
                    drawPreview(state);
                }
            }
        };
        
        waitForContainer();
    };
    
    img.onerror = (error) => {
        console.error('Error loading base image:', error);
        console.error('Failed imageSrc:', imageSrc);
    };
    
    img.src = imageSrc;
}

function setupCanvas(
    img: HTMLImageElement,
    canvas: HTMLCanvasElement,
    state: MaskCreationModalState
) {
    // Calculate maximum available space for the canvas
    const container = canvas.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const padding = 32; // Reduced padding to use more space
    const maxWidth = containerRect.width - padding;
    const maxHeight = containerRect.height - padding;
    
    // Calculate scale to fit the image within the available space
    const scaleX = maxWidth / img.width;
    const scaleY = maxHeight / img.height;
    
    // For portrait images, prioritize height scaling to fill more space
    // For landscape images, prioritize width scaling
    let scale;
    if (img.height > img.width) {
        // Portrait image - scale to fit height, but don't exceed width
        scale = Math.min(scaleY, scaleX, 1);
    } else {
        // Landscape image - scale to fit width, but don't exceed height
        scale = Math.min(scaleX, scaleY, 1);
    }
    
    // Set canvas size to the scaled dimensions
    const scaledWidth = Math.round(img.width * scale);
    const scaledHeight = Math.round(img.height * scale);
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    
    const ctx = canvas.getContext('2d')!;
    if (!ctx) {
        console.error('Failed to get canvas context');
        return;
    }
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
    
    // Create mask layer with same scaled size
    const maskLayer = document.createElement('canvas');
    maskLayer.width = scaledWidth;
    maskLayer.height = scaledHeight;
    const maskCtx = maskLayer.getContext('2d')!;
    maskCtx.clearRect(0, 0, maskLayer.width, maskLayer.height);
    
    // Add class for square images to help with responsive sizing
    if (img.width === img.height) {
        container.classList.add('square-image');
    }
    
    // Store references and scaling information
    state.img = img;
    state.maskLayer = maskLayer;
    state.maskCtx = maskCtx;
    state.ctx = ctx;
    state.scale = scale;
    state.originalWidth = img.width;
    state.originalHeight = img.height;
}

function loadExistingMask(maskSrc: string, state: MaskCreationModalState) {
    const maskedImg = new window.Image();
    maskedImg.crossOrigin = 'anonymous';
    
    maskedImg.onload = () => {
        extractMaskFromImage(maskedImg, state);
        drawPreview(state);
    };
    
    maskedImg.onerror = (error) => {
        console.error('Error loading masked image:', error);
        drawPreview(state);
    };
    
    maskedImg.src = maskSrc;
}

function extractMaskFromImage(maskedImg: HTMLImageElement, state: MaskCreationModalState) {
    // Create a temporary canvas to work with the original image size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskedImg.width;
    tempCanvas.height = maskedImg.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(maskedImg, 0, 0);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Check if the image has any alpha data
    let hasAlphaData = false;
    for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i + 3] < 255) {
            hasAlphaData = true;
            break;
        }
    }
    
    if (hasAlphaData) {
        // Create a temporary canvas to scale the mask to the current canvas size
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = state.maskLayer!.width;
        scaledCanvas.height = state.maskLayer!.height;
        const scaledCtx = scaledCanvas.getContext('2d')!;
        
        // Create a temporary canvas with the original mask data
        const originalMaskCanvas = document.createElement('canvas');
        originalMaskCanvas.width = maskedImg.width;
        originalMaskCanvas.height = maskedImg.height;
        const originalMaskCtx = originalMaskCanvas.getContext('2d')!;
        
        // Extract alpha channel and invert it back to mask
        const maskData = originalMaskCtx.createImageData(maskedImg.width, maskedImg.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const alpha = imageData.data[i + 3];
            const maskValue = 255 - alpha;
            maskData.data[i] = maskValue;     // Red
            maskData.data[i + 1] = maskValue; // Green
            maskData.data[i + 2] = maskValue; // Blue
            maskData.data[i + 3] = 255;       // Alpha
        }
        originalMaskCtx.putImageData(maskData, 0, 0);
        
        // Scale the mask to the current canvas size
        scaledCtx.imageSmoothingEnabled = true;
        scaledCtx.imageSmoothingQuality = 'high';
        scaledCtx.drawImage(originalMaskCanvas, 0, 0, state.maskLayer!.width, state.maskLayer!.height);
        
        // Copy the scaled mask to the mask layer
        const scaledMaskData = scaledCtx.getImageData(0, 0, state.maskLayer!.width, state.maskLayer!.height);
        state.maskCtx!.putImageData(scaledMaskData, 0, 0);
    }
}

function handlePointerDown(
    e: MouseEvent | Touch,
    state: MaskCreationModalState,
    canvas: HTMLCanvasElement
) {
    state.isDrawing = true;
    [state.lastX, state.lastY] = getXY(e, canvas);
}

function handlePointerUp(state: MaskCreationModalState) {
    state.isDrawing = false;
    state.maskCtx!.beginPath();
}

function handlePointerMove(
    e: MouseEvent | Touch,
    state: MaskCreationModalState,
    canvas: HTMLCanvasElement
) {
    if (!state.isDrawing) return;
    
    const [x, y] = getXY(e, canvas);
    const maskCtx = state.maskCtx!;
    
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.lineWidth = state.brushSize;
    
    if (state.tool === 'brush') {
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.strokeStyle = 'white';
    } else {
        // Eraser: add black to create visible areas (remove from mask)
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.strokeStyle = 'black';
    }
    
    maskCtx.beginPath();
    maskCtx.moveTo(state.lastX, state.lastY);
    maskCtx.lineTo(x, y);
    maskCtx.stroke();
    
    [state.lastX, state.lastY] = [x, y];
    drawPreview(state);
}

function getXY(e: MouseEvent | Touch, canvas: HTMLCanvasElement): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [
        (e.clientX - rect.left) * (canvas.width / rect.width),
        (e.clientY - rect.top) * (canvas.height / rect.height)
    ];
}

function drawPreview(state: MaskCreationModalState) {
    const ctx = state.ctx!;
    const img = state.img!;
    const maskLayer = state.maskLayer!;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(maskLayer, 0, 0);
    ctx.globalAlpha = 1.0;
}

function setTool(
    tool: 'brush' | 'eraser',
    brushBtn: HTMLButtonElement,
    eraserBtn: HTMLButtonElement,
    state: MaskCreationModalState
) {
    state.tool = tool;
    if (tool === 'brush') {
        brushBtn.classList.add('active');
        eraserBtn.classList.remove('active');
    } else {
        eraserBtn.classList.add('active');
        brushBtn.classList.remove('active');
    }
}

function setBrushSize(brushSizeInput: HTMLInputElement, state: MaskCreationModalState) {
    state.brushSize = parseInt(brushSizeInput.value);
}

function clearMask(state: MaskCreationModalState) {
    state.maskCtx!.clearRect(0, 0, state.maskLayer!.width, state.maskLayer!.height);
    drawPreview(state);
}

async function saveMask(
    state: MaskCreationModalState,
    options: MaskCreationModalOptions,
    modal: HTMLDivElement
) {
    const maskCanvas = document.createElement('canvas');
    const originalWidth = state.originalWidth ?? 1;
    const originalHeight = state.originalHeight ?? 1;
    maskCanvas.width = originalWidth;
    maskCanvas.height = originalHeight;
    const maskCtx = maskCanvas.getContext('2d')!;
    
    // Get the mask data from the scaled maskLayer
    const scaledMaskData = state.maskLayer!.getContext('2d')!.getImageData(0, 0, state.maskLayer!.width, state.maskLayer!.height);
    
    // Create a temporary canvas to scale the mask back to original size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Create a temporary canvas with the scaled mask data
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = state.maskLayer!.width;
    scaledCanvas.height = state.maskLayer!.height;
    const scaledCtx = scaledCanvas.getContext('2d')!;
    scaledCtx.putImageData(scaledMaskData, 0, 0);
    
    // Scale the mask back to original size
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(scaledCanvas, 0, 0, originalWidth, originalHeight);
    
    // Get the scaled mask data
    const maskData = tempCtx.getImageData(0, 0, originalWidth, originalHeight);
    const finalMaskData = maskCtx.createImageData(originalWidth, originalHeight);
    
    // Create the mask: white areas in our mask should become transparent (alpha=0)
    // black areas should become opaque (alpha=255)
    for (let i = 0; i < finalMaskData.data.length; i += 4) {
        const maskValue = maskData.data[i]; // Use red channel as mask value
        // Invert the mask: white (255) -> alpha 0, black (0) -> alpha 255
        const alphaValue = 255 - maskValue;
        finalMaskData.data[i] = 255;     // Red (white)
        finalMaskData.data[i + 1] = 255; // Green (white)
        finalMaskData.data[i + 2] = 255; // Blue (white)
        finalMaskData.data[i + 3] = alphaValue; // Alpha (transparency)
    }
    
    maskCtx.putImageData(finalMaskData, 0, 0);
    
    maskCanvas.toBlob(async (blob) => {
        if (!blob) return;
        
        // Use the parsed image information from state
        const imageInfo = state.imageInfo!;
        
        // Create mask filename using the clean filename from imageInfo
        const baseName = imageInfo.filename.replace(/\.[^/.]+$/, '');
        const maskName = `${baseName}_mask.png`;
        const maskFile = new File([blob], maskName, { type: 'image/png' });
        
        // Use the clipspace subfolder for the mask
        const maskSubfolder = 'clipspace';
        
        try {
            // Use the local upload mask function
            const imageData = await uploadMaskFile(maskFile, imageInfo, maskSubfolder);
            
            if (options.onMaskCreated) {
                options.onMaskCreated( toComfyUIUrlFromImage(imageData));
            }
            
            // Close the modal after successful save
            closeModal(modal, options.onCancel);
        } catch (error) {
            console.error('Failed to save mask:', error);
            alert('Failed to save mask. Please try again.');
        }
    }, 'image/png');
}

function closeModal(modal: HTMLDivElement, onCancel?: () => void) {
    document.body.classList.remove('locked');
    modal.remove();
    if (onCancel) onCancel();
}

export async function uploadMaskFile(maskFile: File, originalImage: Image, subfolder?: string): Promise<Image> {
    const formData = new FormData();
    formData.append('image', maskFile);
    formData.append('original_ref', JSON.stringify(originalImage));
    
    if (subfolder) {
        formData.append('subfolder', subfolder);
    }

    const response = await fetch('/comfyui/upload/mask', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Mask upload failed');
    }

    const result = await response.json();
    
    // Get values from the response
    const responseFilename = result.externalResponse?.name || maskFile.name;
    const responseSubfolder = result.externalResponse?.subfolder;
    const responseType = result.externalResponse?.type;

    return {
        filename: responseFilename,
        subfolder: responseSubfolder || subfolder || undefined,
        type: responseType || 'input'
    };
} 