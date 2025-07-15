/**
 * WebSocket Manager for handling all WebSocket operations
 */

export interface WebSocketOptions {
    onMessage?: (event: MessageEvent) => void;
    onError?: (error: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onOpen?: () => void;
    timeout?: number;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
}

export interface WebSocketMessage {
    type: string;
    data?: any;
    message?: string;
}

export class WebSocketManager {
    private ws: WebSocket | null = null;
    private options: WebSocketOptions;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isConnecting = false;
    private isDestroyed = false;

    constructor(options: WebSocketOptions = {}) {
        this.options = {
            timeout: 5000,
            autoReconnect: true,
            maxReconnectAttempts: 5,
            reconnectDelay: 1000,
            ...options
        };
    }

    /**
     * Allows updating event handlers after instantiation
     */
    public setHandlers(handlers: Partial<Pick<WebSocketOptions, 'onMessage' | 'onError' | 'onClose' | 'onOpen'>>): this {
        this.options = {
            ...this.options,
            ...handlers
        };
        return this;
    }

    /**
     * Establishes a WebSocket connection
     * @returns Promise that resolves when the connection is established
     */
    async connect(): Promise<void> {
        if (this.isConnecting || this.isDestroyed) {
            return;
        }

        this.isConnecting = true;

        try {
            // Use wss:// when the page is served over HTTPS
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
            
            this.ws = new WebSocket(wsUrl);
            
            await this.setupConnection();
            this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        } catch (error) {
            this.isConnecting = false;
            throw error;
        }
    }

    /**
     * Sets up the WebSocket connection with event handlers
     */
    private setupConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                reject(new Error('WebSocket not initialized'));
                return;
            }

            const timeout = setTimeout(() => {
                if (this.ws?.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, this.options.timeout);

            this.ws.onopen = () => {
                clearTimeout(timeout);
                console.log('WebSocket connection established');
                this.isConnecting = false;
                
                if (this.options.onOpen) {
                    this.options.onOpen();
                }
                resolve();
            };

            this.ws.onerror = (error) => {
                clearTimeout(timeout);
                console.error('WebSocket connection error:', error);
                this.isConnecting = false;
                
                if (this.options.onError) {
                    this.options.onError(error);
                }
                reject(new Error('Failed to establish WebSocket connection'));
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                this.isConnecting = false;
                
                if (this.options.onClose) {
                    this.options.onClose(event);
                }

                // Handle auto-reconnection
                if (this.options.autoReconnect && !this.isDestroyed && event.code !== 1000) {
                    this.handleReconnection();
                }
            };

            this.ws.onmessage = (event) => {
                if (this.options.onMessage) {
                    this.options.onMessage(event);
                }
            };
        });
    }

    /**
     * Handles automatic reconnection with exponential backoff
     */
    private handleReconnection(): void {
        if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = (this.options.reconnectDelay || 1000) * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                console.error('Reconnection failed:', error);
                // Continue trying until max attempts reached
                this.handleReconnection();
            }
        }, delay);
    }

    /**
     * Ensures the WebSocket connection is open, reconnecting if necessary
     * @returns Promise that resolves when connection is ready
     */
    private async ensureConnection(): Promise<void> {
        if (this.isDestroyed) {
            throw new Error('WebSocket manager has been destroyed');
        }

        if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
            await this.connect();
        }

        if (this.ws?.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket connection is not open');
        }
    }

    /**
     * Sends a message through the WebSocket connection
     * @param message The message to send (will be JSON stringified)
     * @returns Promise that resolves when message is sent
     */
    async send(message: any): Promise<void> {
        await this.ensureConnection();
        
        if (!this.ws) {
            throw new Error('WebSocket connection not available');
        }

        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        this.ws.send(messageString);
    }

    /**
     * Sends a typed message through the WebSocket connection
     * @param message The typed message to send
     * @returns Promise that resolves when message is sent
     */
    async sendTyped(message: WebSocketMessage): Promise<void> {
        await this.send(message);
    }

    /**
     * Closes the WebSocket connection
     * @param code Close code (default: 1000 - normal closure)
     * @param reason Close reason
     */
    close(code: number = 1000, reason?: string): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close(code, reason);
        }
    }

    /**
     * Destroys the WebSocket manager and cleans up resources
     */
    destroy(): void {
        this.isDestroyed = true;
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Manager destroyed');
            this.ws = null;
        }
    }

    /**
     * Gets the current connection state
     * @returns The WebSocket ready state
     */
    get readyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    /**
     * Checks if the connection is open
     * @returns True if the connection is open
     */
    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /**
     * Gets the underlying WebSocket instance (for advanced use cases)
     * @returns The WebSocket instance or null
     */
    get connection(): WebSocket | null {
        return this.ws;
    }
} 