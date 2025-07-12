export interface PullToRefreshOptions {
    threshold?: number;
    onRefresh?: () => Promise<void>;
    indicatorId?: string;
}

export class PullToRefresh {
    private startY = 0;
    private currentY = 0;
    private isPulling = false;
    private threshold: number;
    private onRefresh: () => Promise<void>;
    private indicatorId: string;
    private pullIndicator: HTMLElement | null = null;
    private isInitialized = false;

    // Store bound event handlers for proper cleanup
    private boundTouchStart: (e: TouchEvent) => void;
    private boundTouchMove: (e: TouchEvent) => void;
    private boundTouchEnd: (e: TouchEvent) => void;

    constructor(options: PullToRefreshOptions = {}) {
        this.threshold = options.threshold || 100;
        this.onRefresh = options.onRefresh || (() => Promise.resolve());
        this.indicatorId = options.indicatorId || 'pull-indicator';
        
        // Bind event handlers once to ensure proper cleanup
        this.boundTouchStart = this.handleTouchStart.bind(this);
        this.boundTouchMove = this.handleTouchMove.bind(this);
        this.boundTouchEnd = this.handleTouchEnd.bind(this);
    }

    public init(): void {
        if (this.isInitialized) {
            console.warn('PullToRefresh is already initialized');
            return;
        }

        // Add event listeners with proper options for PWA
        document.addEventListener('touchstart', this.boundTouchStart, { passive: true });
        document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        document.addEventListener('touchend', this.boundTouchEnd, { passive: true });
        
        this.isInitialized = true;
    }

    private getPullIndicator(): HTMLElement | null {
        if (!this.pullIndicator) {
            this.pullIndicator = document.getElementById(this.indicatorId);
            if (this.pullIndicator) {
                // Initially hide the pull indicator
                this.pullIndicator.style.transform = 'translateY(-60px)';
            }
        }
        return this.pullIndicator;
    }

    private updatePullIndicator(pullDistance: number): void {
        const indicator = this.getPullIndicator();
        if (!indicator) return;
        
        if (pullDistance > 0) {
            // Limit the maximum pull distance to prevent going too far
            const maxPullDistance = this.threshold + 20;
            const limitedPullDistance = Math.min(pullDistance, maxPullDistance);
            const pullPercentage = limitedPullDistance / this.threshold;
            const indicatorOffset = -60 + (pullPercentage * 60);
            
            // Ensure the indicator doesn't go beyond the maximum
            const finalOffset = Math.min(indicatorOffset, 20);
            
            indicator.style.transform = `translateY(${finalOffset}px)`;
            
            const pullText = indicator.querySelector('.pull-text') as HTMLElement;
            const pullIcon = indicator.querySelector('.pull-icon') as HTMLElement;
            
            if (pullDistance >= this.threshold) {
                if (pullText) pullText.textContent = 'Release to refresh';
                if (pullIcon) pullIcon.textContent = '↑';
            } else {
                if (pullText) pullText.textContent = 'Pull down to refresh';
                if (pullIcon) pullIcon.textContent = '↓';
            }
        } else {
            indicator.style.transform = 'translateY(-60px)';
        }
    }

    private handleTouchStart(e: TouchEvent): void {
        // Only allow pull-to-refresh when at the top of the page
        if (window.scrollY <= 0) {
            this.startY = e.touches[0].clientY;
            this.isPulling = true;
        } else {
            this.isPulling = false;
        }
    }

    private handleTouchMove(e: TouchEvent): void {
        if (!this.isPulling) return;
        
        this.currentY = e.touches[0].clientY;
        const pullDistance = this.currentY - this.startY;
        
        if (pullDistance > 0) {
            // Update pull indicator
            this.updatePullIndicator(pullDistance);
            
            // Prevent the page from scrolling past the top
            e.preventDefault();
            e.stopPropagation();
        }
    }

    private handleTouchEnd(_e: TouchEvent): void {
        if (!this.isPulling) return;
        
        const pullDistance = this.currentY - this.startY;
        const indicator = this.getPullIndicator();
        
        if (pullDistance > this.threshold) {
            // Show loading state
            const pullText = indicator?.querySelector('.pull-text') as HTMLElement;
            const pullIcon = indicator?.querySelector('.pull-icon') as HTMLElement;
            if (pullText && pullIcon) {
                pullText.textContent = 'Refreshing...';
                pullIcon.textContent = '⟳';
            }
            
            // Trigger refresh
            this.onRefresh().then(() => {
                // Hide indicator after refresh completes
                setTimeout(() => {
                    this.updatePullIndicator(0);
                }, 500);
            });
        } else {
            // Hide pull indicator if not enough pull
            this.updatePullIndicator(0);
        }
        
        this.isPulling = false;
    }

    public destroy(): void {
        if (!this.isInitialized) {
            return;
        }

        document.removeEventListener('touchstart', this.boundTouchStart);
        document.removeEventListener('touchmove', this.boundTouchMove);
        document.removeEventListener('touchend', this.boundTouchEnd);
        
        this.isInitialized = false;
        this.pullIndicator = null;
    }

    // Public method to manually trigger refresh
    public async refresh(): Promise<void> {
        await this.onRefresh();
    }

    // Public method to update the refresh callback
    public setRefreshCallback(callback: () => Promise<void>): void {
        this.onRefresh = callback;
    }
} 