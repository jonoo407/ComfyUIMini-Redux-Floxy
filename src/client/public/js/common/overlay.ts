// Configuration constants
const OVERLAY_CONFIG = {
    HEADER_OFFSET_REM: 5, // 5rem = 80px at 16px base font
    BOTTOM_PADDING_REM: 3.125, // 3.125rem = 50px at 16px base font
    SCROLL_THRESHOLD: 1, // Only update if scroll changed by more than 1px
    FADE_OUT_DURATION: 150 // ms - only this is still needed for timeout
} as const;

// Cached font size for rem to px conversion
let cachedFontSize: number | null = null;

// Helper function to convert rem to pixels (with caching)
const remToPx = (rem: number): number => {
    if (cachedFontSize === null) {
        cachedFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    return rem * cachedFontSize;
};

// Helper function to create DOM elements with classes
const createElement = <K extends keyof HTMLElementTagNameMap>(
    tag: K, 
    className?: string
): HTMLElementTagNameMap[K] => {
    const element = document.createElement(tag);
    if (className) {
        element.classList.add(className);
    }
    return element;
};

// Helper function to create content node
const createContentNode = (content: string | Node): Node => {
    if (typeof content === 'string') {
        const contentDiv = createElement('div');
        contentDiv.innerHTML = content;
        return contentDiv;
    }
    return content;
};

// Helper function to create button
const createButton = ({ label, className, onClick }: OverlayButton, close: () => void): HTMLButtonElement => {
    const btn = createElement('button');
    
    // Clean up class name logic
    const baseClass = 'overlay-button';
    const cleanClassName = className?.replace(/delete-overlay/g, 'overlay') || '';
    btn.className = cleanClassName ? `${baseClass} ${cleanClassName}` : baseClass;
    
    btn.textContent = label;
    btn.addEventListener('click', () => {
        close();
        if (onClick) onClick(close);
    });
    
    return btn;
};

export interface OverlayButton {
    label: string;
    className?: string;
    onClick?: (close: () => void) => void;
}

export interface OverlayOptions {
    content: string | Node;
    buttons?: OverlayButton[];
    parent?: HTMLElement;
}

interface Position {
    top: number;
    left: number;
    visible: boolean;
}

function calculateOptimalPosition(parentRect: DOMRect, cachedContentHeight: number, cachedContentWidth: number): Position {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Account for the gallery page header (using rem values)
    const headerOffset = remToPx(OVERLAY_CONFIG.HEADER_OFFSET_REM);
    const availableViewportHeight = viewportHeight - headerOffset;
    
    // Calculate the parent's position relative to viewport
    const { top: parentTop, left: parentLeft, height: parentHeight, width: parentWidth } = parentRect;
    
    // Calculate the visible portion of the parent within the viewport
    const visibleParentBottom = Math.min(availableViewportHeight, parentTop + parentHeight);
    const visibleParentHeight = visibleParentBottom - Math.max(headerOffset, parentTop);
    
    // Check if there's enough room for the content within the visible portion of the parent
    const hasEnoughVerticalRoom = cachedContentHeight <= visibleParentHeight;
    
    // If there's not enough room vertically, hide the overlay
    if (!hasEnoughVerticalRoom) {
        return { top: 0, left: 0, visible: false };
    }
    
    // Calculate where the content would be if centered on the parent
    const centeredTop = parentTop + (parentHeight / 2) - (cachedContentHeight / 2);
    const centeredLeft = parentLeft + (parentWidth / 2) - (cachedContentWidth / 2);
    
    // Calculate optimal vertical position relative to viewport
    let top: number;
    if (centeredTop < headerOffset) {
        // Content would go above header - position just below header
        top = headerOffset;
    } else if (centeredTop + cachedContentHeight > availableViewportHeight) {
        // Content would go below available viewport - position at bottom with padding
        const padding = remToPx(OVERLAY_CONFIG.BOTTOM_PADDING_REM);
        top = availableViewportHeight - cachedContentHeight - padding;
    } else {
        // Content fits in viewport - use centered position
        top = centeredTop;
    }
    
    // Center horizontally on the parent, but ensure it stays within viewport
    let left: number;
    if (centeredLeft < 0) {
        // Content would go left of viewport - position at left of viewport
        left = 0;
    } else if (centeredLeft + cachedContentWidth > viewportWidth) {
        // Content would go right of viewport - position at right of viewport
        left = viewportWidth - cachedContentWidth;
    } else {
        // Content fits horizontally - use centered position
        left = centeredLeft;
    }
    
    return { top, left, visible: true };
}

export function openOverlay({ content, buttons = [], parent }: OverlayOptions) {
    // Create overlay structure
    const overlayContainer = createElement('div', 'overlay-container');
    const background = createElement('div', 'overlay-background');
    const contentWrapper = createElement('div', 'overlay-content-wrapper');
    
    // Add 'anchored' class if overlay is anchored to a parent
    if (parent) {
        contentWrapper.classList.add('anchored');
    }

    overlayContainer.appendChild(background);
    overlayContainer.appendChild(contentWrapper);

    // Add content
    const contentNode = createContentNode(content);
    if (contentNode instanceof Element) {
        contentNode.classList.add('overlay-message');
    }
    contentWrapper.appendChild(contentNode);

    // Add buttons
    if (buttons.length > 0) {
        const buttonsDiv = createElement('div', 'overlay-buttons');
        buttons.forEach(buttonConfig => {
            const btn = createButton(buttonConfig, close);
            buttonsDiv.appendChild(btn);
        });
        contentWrapper.appendChild(buttonsDiv);
    }

    const targetParent = parent || document.body;
    targetParent.appendChild(overlayContainer);
    
    // State management
    let cachedContentHeight: number | null = null;
    let cachedContentWidth: number | null = null;
    let cachedParentRect: DOMRect | null = null;
    let lastScrollY = window.scrollY;
    let lastScrollX = window.scrollX;
    let isCurrentlyVisible = true;
    let fadeTimeout: number | null = null;
    let animationFrameId: number | null = null;
    
    // Animation frame scheduling
    const scheduleUpdate = () => {
        if (animationFrameId) return;
        animationFrameId = requestAnimationFrame(() => {
            updatePosition();
            animationFrameId = null;
        });
    };
    
    // Visibility transition handler
    const handleVisibilityTransition = (shouldBeVisible: boolean) => {
        if (shouldBeVisible === isCurrentlyVisible) return;
        
        // Clear any existing fade timeout
        if (fadeTimeout) {
            clearTimeout(fadeTimeout);
            fadeTimeout = null;
        }
        
        if (shouldBeVisible) {
            // Fade in
            contentWrapper.classList.remove('fade-out', 'hidden');
            contentWrapper.classList.add('fade-in');
            
            isCurrentlyVisible = true;
        } else {
            // Fade out
            contentWrapper.classList.remove('fade-in');
            contentWrapper.classList.add('fade-out');
            
            fadeTimeout = window.setTimeout(() => {
                contentWrapper.classList.add('hidden');
                fadeTimeout = null;
            }, OVERLAY_CONFIG.FADE_OUT_DURATION);
            
            isCurrentlyVisible = false;
        }
    };
    
    // Position update handler
    const updatePosition = () => {
        const currentScrollY = window.scrollY;
        const currentScrollX = window.scrollX;
        
        // Only recalculate parent rect if scroll position changed significantly or it's null
        if (!cachedParentRect || 
            Math.abs(currentScrollY - lastScrollY) > OVERLAY_CONFIG.SCROLL_THRESHOLD || 
            Math.abs(currentScrollX - lastScrollX) > OVERLAY_CONFIG.SCROLL_THRESHOLD) {
            cachedParentRect = targetParent.getBoundingClientRect();
            lastScrollY = currentScrollY;
            lastScrollX = currentScrollX;
        }
        
        if (!cachedContentHeight || !cachedContentWidth || !cachedParentRect) {
            return; // Wait for dimensions to be cached
        }
        
        const position = calculateOptimalPosition(cachedParentRect, cachedContentHeight, cachedContentWidth);
        
        // Handle visibility with smooth transitions
        handleVisibilityTransition(position.visible);
        
        if (!position.visible) {
            return; // Don't update position if not visible
        }
        
        // Apply positioning using CSS custom properties
        contentWrapper.style.setProperty('--overlay-x', `${position.left}px`);
        contentWrapper.style.setProperty('--overlay-y', `${position.top}px`);
        contentWrapper.classList.add('positioned');
    };
    
    // Event handlers
    const scrollHandler = () => scheduleUpdate();
    const resizeHandler = () => {
        // Re-cache dimensions on resize
        const contentRect = contentWrapper.getBoundingClientRect();
        cachedContentHeight = contentRect.height;
        cachedContentWidth = contentRect.width;
        cachedParentRect = null; // Force recalculation of parent rect
        requestAnimationFrame(updatePosition);
    };
    
    // Initial setup
    requestAnimationFrame(() => {
        const contentRect = contentWrapper.getBoundingClientRect();
        cachedContentHeight = contentRect.height;
        cachedContentWidth = contentRect.width;
        cachedParentRect = targetParent.getBoundingClientRect();
        lastScrollY = window.scrollY;
        lastScrollX = window.scrollX;
        updatePosition();
    });
    
    // Add event listeners
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', resizeHandler, { passive: true });

    // Cleanup function
    function close() {
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('resize', resizeHandler);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (fadeTimeout) {
            clearTimeout(fadeTimeout);
        }
        overlayContainer.remove();
    }
    
    return close;
} 