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

export function openOverlay({ content, buttons = [], parent }: OverlayOptions) {
    const overlayContainer = document.createElement('div');
    overlayContainer.classList.add('overlay-container');

    // Background
    const background = document.createElement('div');
    background.classList.add('overlay-background');
    overlayContainer.appendChild(background);

    // Content
    let contentNode: Node;
    if (typeof content === 'string') {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = content;
        contentNode = contentDiv;
    } else {
        contentNode = content;
    }
    if (contentNode instanceof Element) {
        contentNode.classList.add('overlay-message');
    }
    overlayContainer.appendChild(contentNode);

    // Buttons
    if (buttons.length > 0) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('overlay-buttons');
        buttons.forEach(({ label, className, onClick }) => {
            const btn = document.createElement('button');
            btn.className = 'overlay-button' + (className ? ' ' + className.replace(/delete-overlay/g, 'overlay') : '');
            btn.textContent = label;
            btn.addEventListener('click', () => {
                close();
                if (onClick) onClick(close);
            });
            buttonsDiv.appendChild(btn);
        });
        overlayContainer.appendChild(buttonsDiv);
    }

    function close() {
        overlayContainer.remove();
    }

    (parent || document.body).appendChild(overlayContainer);
    return close;
} 