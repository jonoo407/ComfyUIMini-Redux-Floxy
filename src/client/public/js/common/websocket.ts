/**
 * Common WebSocket utilities for managing connections
 */

export interface WebSocketOptions {
    onMessage?: (event: MessageEvent) => void;
    onError?: (error: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onOpen?: () => void;
    timeout?: number;
}

/**
 * Creates and establishes a new WebSocket connection
 * @param options Configuration options for the WebSocket connection
 * @returns Promise that resolves when the connection is established
 */
export function createWebSocketConnection(options: WebSocketOptions = {}): Promise<WebSocket> {
    const {
        onMessage,
        onError,
        onClose,
        onOpen,
        timeout = 5000
    } = options;

    return new Promise((resolve, reject) => {
        // Use wss:// when the page is served over HTTPS
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const newWs = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
        
        newWs.onopen = () => {
            console.log('WebSocket connection established');
            setupWebSocketEventHandlers(newWs, { onError, onClose });
            if (onOpen) onOpen();
            resolve(newWs);
        };
        
        newWs.onerror = (error) => {
            console.error('WebSocket connection error:', error);
            if (onError) onError(error);
            reject(new Error('Failed to establish WebSocket connection'));
        };

        // Set up message handler if provided
        if (onMessage) {
            newWs.onmessage = onMessage;
        }
        
        // Set a timeout for connection establishment
        setTimeout(() => {
            if (newWs.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket connection timeout'));
            }
        }, timeout);
    });
}

/**
 * Ensures WebSocket connection is open, reconnecting if necessary
 * @param ws The WebSocket instance to check/ensure is open
 * @returns Promise that resolves with an open WebSocket connection
 */
export async function ensureWebSocketConnection(ws: WebSocket): Promise<WebSocket> {
    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        console.log('WebSocket connection is closed or closing, attempting to reconnect...');
        
        // Close existing connection if it exists
        if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
        }
        
        try {
            // Copy event handlers from the existing connection
            const options: WebSocketOptions = {
                onMessage: ws.onmessage || undefined,
                onError: ws.onerror || undefined,
                onClose: ws.onclose || undefined
            };
            
            const newWs = await createWebSocketConnection(options);
            return newWs;
        } catch (error) {
            console.error('Failed to reconnect WebSocket:', error);
            throw error;
        }
    }
    
    return ws;
}

/**
 * Sets up event handlers for a WebSocket connection
 * @param websocket The WebSocket instance
 * @param options Configuration options for event handlers
 */
function setupWebSocketEventHandlers(
    websocket: WebSocket, 
    options: { onError?: (error: Event) => void; onClose?: (event: CloseEvent) => void } = {}
) {
    const { onError, onClose } = options;

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
    };
    
    websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (onClose) onClose(event);
    };
} 