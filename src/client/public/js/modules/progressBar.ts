import { ProgressMessage } from '@shared/types/WebSocket.js';
import { Workflow } from '@shared/types/Workflow.js';

export interface ProgressBarElements {
    current: {
        innerElem: HTMLElement;
        textElem: HTMLElement;
    };
    total: {
        innerElem: HTMLElement;
        textElem: HTMLElement;
    };
}

export interface WorkflowNode {
    id: string;
    class_type: string;
    inputs: Record<string, any>;
}

export class ProgressBarManager {
    private elements: ProgressBarElements;
    private workflow: Workflow | null = null;
    private totalNodes: number = 0;
    private completedNodes: number = 0;
    private currentNodeProgress: number = 0;
    private currentNodeMax: number = 1;

    constructor() {
        this.elements = {
            current: {
                innerElem: document.querySelector('.current-image-progress .progress-bar-inner') as HTMLElement,
                textElem: document.querySelector('.current-image-progress .progress-bar-text') as HTMLElement,
            },
            total: {
                innerElem: document.querySelector('.total-images-progress .progress-bar-inner') as HTMLElement,
                textElem: document.querySelector('.total-images-progress .progress-bar-text') as HTMLElement,
            },
        };
    }

    /**
     * Initializes the progress manager with workflow information
     * @param workflow The workflow to track progress for
     */
    initializeWithWorkflow(workflow: Workflow): void {
        this.workflow = workflow;
        this.totalNodes = Object.keys(workflow).length;
        this.completedNodes = 0;
        this.currentNodeProgress = 0;
        this.currentNodeMax = 1;
        this.updateTotalProgress();
    }

    /**
     * Resets the progress bars to 0% and resets counters
     */
    reset(): void {
        this.setProgressBar('current', '0%');
        this.setProgressBar('total', '0%');
        this.workflow = null;
        this.totalNodes = 0;
        this.completedNodes = 0;
        this.currentNodeProgress = 0;
        this.currentNodeMax = 1;
    }

    /**
     * Updates a progress bar with a new percentage.
     * Percentage should include the % symbol.
     *
     * @param type Which progress bar to change.
     * @param percentage What percentage to set the progress bar to.
     */
    setProgressBar(type: 'total' | 'current', percentage: string): void {
        const textElem = type === 'total' ? this.elements.total.textElem : this.elements.current.textElem;
        const barElem = type === 'total' ? this.elements.total.innerElem : this.elements.current.innerElem;

        textElem.textContent = percentage;
        barElem.style.width = percentage;
    }

    /**
     * Updates progress bars based on WebSocket progress message
     * @param messageData The progress message data
     */
    updateProgressBars(messageData: ProgressMessage): void {
        this.currentNodeProgress = messageData.value;
        this.currentNodeMax = messageData.max;

        // Update current node progress
        const currentProgress = this.currentNodeMax > 0 ? 
            `${Math.round((this.currentNodeProgress / this.currentNodeMax) * 100)}%` : '0%';
        this.setProgressBar('current', currentProgress);

        // Check if current node is complete
        if (this.currentNodeProgress >= this.currentNodeMax && this.currentNodeMax > 0) {
            this.completedNodes += 1;
            this.completedNodes = Math.min(this.completedNodes, this.totalNodes);
        }

        // Update total progress
        this.updateTotalProgress();
    }

    /**
     * Updates the total progress based on completed nodes and current node progress
     */
    private updateTotalProgress(): void {
        if (this.totalNodes === 0) return;

        // Calculate progress: completed nodes + current node progress
        const completedProgress = this.completedNodes / this.totalNodes;
        const currentNodeProgress = this.currentNodeMax > 0 ? 
            (this.currentNodeProgress / this.currentNodeMax) / this.totalNodes : 0;
        
        const totalProgress = Math.min(completedProgress + currentNodeProgress, 1);
        const totalPercentage = `${Math.round(totalProgress * 100)}%`;
        
        this.setProgressBar('total', totalPercentage);
    }

    /**
     * Sets both progress bars to 100% (used when generation completes)
     */
    complete(): void {
        this.setProgressBar('current', '100%');
        this.setProgressBar('total', '100%');
    }

    /**
     * Gets the current total node count
     * @returns The total node count
     */
    getTotalNodeCount(): number {
        return this.totalNodes;
    }

    /**
     * Gets the current completed node count
     * @returns The completed node count
     */
    getCompletedNodeCount(): number {
        return this.completedNodes;
    }

    /**
     * Gets the current node progress
     * @returns The current node progress
     */
    getCurrentNodeProgress(): number {
        return this.currentNodeProgress;
    }

    /**
     * Gets the current node max value
     * @returns The current node max value
     */
    getCurrentNodeMax(): number {
        return this.currentNodeMax;
    }
} 