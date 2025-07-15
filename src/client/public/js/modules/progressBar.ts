import { ProgressMessage } from '@shared/types/WebSocket.js';
import { Workflow } from '@shared/types/Workflow.js';

export interface ProgressBarElements {
    current: {
        innerElem: HTMLElement;
        textElem: HTMLElement;
        labelElem: HTMLElement;
    };
    total: {
        innerElem: HTMLElement;
        textElem: HTMLElement;
    };
}

interface NodeInfo {
    id: string;
    dependencies: string[];
}

export class ProgressBarManager {
    private elements: ProgressBarElements;
    private workflow: Workflow | null = null;
    private totalNodes: number = 0;
    private completedNodes: Set<string> = new Set();
    private currentNodeProgress: number = 0;
    private currentNodeMax: number = 1;
    private currentNodeId: string | null = null;
    private nodeInfoMap: Map<string, NodeInfo> = new Map();
    
    // DOM update optimization
    private lastTotalPercentage: string = '';
    private lastCurrentPercentage: string = '';
    private pendingCurrentUpdate: number | null = null;
    private pendingTotalUpdate: number | null = null;
    private synchronousMode: boolean = false; // For testing

    constructor() {
        this.elements = {
            current: {
                innerElem: document.querySelector('.current-image-progress .progress-bar-inner') as HTMLElement,
                textElem: document.querySelector('.current-image-progress .progress-bar-text') as HTMLElement,
                labelElem: document.querySelector('.current-image-progress-label') as HTMLElement,
            },
            total: {
                innerElem: document.querySelector('.total-images-progress .progress-bar-inner') as HTMLElement,
                textElem: document.querySelector('.total-images-progress .progress-bar-text') as HTMLElement,
            },
        };
    }

    /**
     * Analyzes the workflow to build dependency relationships
     */
    private analyzeWorkflowStructure(workflow: Workflow): void {
        this.nodeInfoMap.clear();
        
        // First pass: identify all nodes and their direct dependencies
        for (const [nodeId, node] of Object.entries(workflow)) {
            const dependencies: string[] = [];
            
            // Analyze inputs to find dependencies
            if (node.inputs) {
                for (const inputValue of Object.values(node.inputs)) {
                    if (Array.isArray(inputValue) && inputValue.length >= 2) {
                        const dependencyNodeId = inputValue[0];
                        if (typeof dependencyNodeId === 'string' && workflow[dependencyNodeId]) {
                            dependencies.push(dependencyNodeId);
                        }
                    }
                }
            }

            this.nodeInfoMap.set(nodeId, {
                id: nodeId,
                dependencies,
            });
        }

        // Second pass: build dependent relationships
        for (const nodeInfo of this.nodeInfoMap.values()) {
            for (const depId of nodeInfo.dependencies) {
                const depNode = this.nodeInfoMap.get(depId);
                if (depNode) {
                    // The dependents array is no longer used, so we don't add it here.
                    // The getAllDependencies method will handle transitive dependencies.
                }
            }
        }
    }

    /**
     * Gets all dependencies of a node (including transitive dependencies)
     */
    private getAllDependencies(nodeId: string): Set<string> {
        const allDeps = new Set<string>();
        const visited = new Set<string>();
        
        const collectDeps = (id: string) => {
            if (visited.has(id)) return;
            visited.add(id);
            
            const nodeInfo = this.nodeInfoMap.get(id);
            if (!nodeInfo) return;
            
            for (const depId of nodeInfo.dependencies) {
                allDeps.add(depId);
                collectDeps(depId);
            }
        };
        
        collectDeps(nodeId);
        return allDeps;
    }

    /**
     * Updates the total progress based on completed nodes
     */
    private updateTotalProgress(): void {
        if (this.totalNodes === 0) return;

        const totalProgress = Math.min(this.completedNodes.size / this.totalNodes, 1);
        const totalPercentage = `${Math.round(totalProgress * 100)}%`;

        this.setProgressBarOptimized('total', totalPercentage);
    }

    /**
     * Initializes the progress manager with workflow information
     */
    initializeWithWorkflow(workflow: Workflow): void {
        this.workflow = workflow;
        this.totalNodes = Object.keys(workflow).length;
        this.completedNodes.clear();
        this.currentNodeProgress = 0;
        this.currentNodeMax = 1;
        this.currentNodeId = null;
        
        // Analyze workflow structure
        this.analyzeWorkflowStructure(workflow);
        
        this.updateTotalProgress();
    }

    /**
     * Resets the progress bars to 0% and resets counters
     */
    reset(): void {
        // Cancel any pending DOM updates
        if (this.pendingCurrentUpdate !== null) {
            cancelAnimationFrame(this.pendingCurrentUpdate);
            this.pendingCurrentUpdate = null;
        }
        if (this.pendingTotalUpdate !== null) {
            cancelAnimationFrame(this.pendingTotalUpdate);
            this.pendingTotalUpdate = null;
        }
        
        this.setProgressBarOptimized('current', '0%');
        this.setProgressBarOptimized('total', '0%');
        if (this.elements.current.labelElem) {
            this.elements.current.labelElem.textContent = 'Current node progress';
        }
        
        this.workflow = null;
        this.totalNodes = 0;
        this.completedNodes.clear();
        this.currentNodeProgress = 0;
        this.currentNodeMax = 1;
        this.currentNodeId = null;
        this.nodeInfoMap.clear();
        
        this.lastTotalPercentage = '';
        this.lastCurrentPercentage = '';
    }

    /**
     * Updates a progress bar with a new percentage.
     */
    setProgressBar(type: 'total' | 'current', percentage: string): void {
        const textElem = type === 'total' ? this.elements.total.textElem : this.elements.current.textElem;
        const barElem = type === 'total' ? this.elements.total.innerElem : this.elements.current.innerElem;

        textElem.textContent = percentage;
        barElem.style.width = percentage;
    }

    /**
     * Updates progress bars based on WebSocket progress message
     */
    updateProgressBars(messageData: ProgressMessage): void {
        const previousNodeId = this.currentNodeId;
        this.currentNodeProgress = messageData.value;
        this.currentNodeMax = messageData.max;
        this.currentNodeId = messageData.node || null;

        // If we have a new current node, add all its dependencies to completed set
        if (this.currentNodeId && this.currentNodeId !== previousNodeId) {
            const allDeps = this.getAllDependencies(this.currentNodeId);
            for (const depId of allDeps) {
                this.completedNodes.add(depId);
            }
        }

        // Update current node label
        this.updateCurrentNodeLabel();

        // Update current node progress
        const currentProgress = this.currentNodeMax > 0 ? 
            `${Math.round((this.currentNodeProgress / this.currentNodeMax) * 100)}%` : '0%';
        this.setProgressBarOptimized('current', currentProgress);

        // If current node is complete, add it to completed set
        if (this.currentNodeId && this.currentNodeProgress >= this.currentNodeMax && this.currentNodeMax > 0) {
            this.completedNodes.add(this.currentNodeId);
        }

        // Update total progress
        this.updateTotalProgress();
    }

    /**
     * Sets both progress bars to 100% (used when generation completes)
     */
    complete(): void {
        this.setProgressBarOptimized('current', '100%');
        this.setProgressBarOptimized('total', '100%');
    }



    /**
     * Gets the current total node count
     */
    getTotalNodeCount(): number {
        return this.totalNodes;
    }

    /**
     * Gets the current completed node count
     */
    getCompletedNodeCount(): number {
        return this.completedNodes.size;
    }

    /**
     * Gets the current node progress
     */
    getCurrentNodeProgress(): number {
        return this.currentNodeProgress;
    }

    /**
     * Gets the current node max value
     */
    getCurrentNodeMax(): number {
        return this.currentNodeMax;
    }

    /**
     * Sets the current node and updates the label
     */
    setCurrentNode(nodeId: string): void {
        this.currentNodeId = nodeId;
        this.updateCurrentNodeLabel();
    }

    /**
     * Marks a node as completed and updates the total progress
     */
    markNodeCompleted(nodeId: string): void {
        this.completedNodes.add(nodeId);
        this.updateTotalProgress();
    }

    /**
     * Gets the display name for a node
     */
    private getNodeDisplayName(nodeId: string): string {
        if (!this.workflow || !this.workflow[nodeId]) {
            return nodeId;
        }
        
        const node = this.workflow[nodeId];
        return node._meta?.title || node.class_type || nodeId;
    }

    /**
     * Updates the current node progress label
     */
    private updateCurrentNodeLabel(): void {
        if (!this.elements.current.labelElem) {
            return;
        }
        
        if (!this.currentNodeId) {
            this.elements.current.labelElem.textContent = 'Current node progress';
            return;
        }
        
        const nodeName = this.getNodeDisplayName(this.currentNodeId);
        this.elements.current.labelElem.textContent = `${nodeName} progress`;
    }

    /**
     * Cleanup method to prevent memory leaks
     */
    cleanup(): void {
        // Cancel any pending updates
        if (this.pendingCurrentUpdate !== null) {
            cancelAnimationFrame(this.pendingCurrentUpdate);
            this.pendingCurrentUpdate = null;
        }
        if (this.pendingTotalUpdate !== null) {
            cancelAnimationFrame(this.pendingTotalUpdate);
            this.pendingTotalUpdate = null;
        }
        
        // Clear all data structures
        this.nodeInfoMap.clear();
        this.workflow = null;
        this.completedNodes.clear();
        
        // Reset state
        this.totalNodes = 0;
        this.currentNodeProgress = 0;
        this.currentNodeMax = 1;
        this.currentNodeId = null;
        this.lastTotalPercentage = '';
        this.lastCurrentPercentage = '';
    }

    /**
     * Optimized DOM update with change detection and throttling
     */
    private setProgressBarOptimized(type: 'total' | 'current', percentage: string): void {
        // Skip DOM update if percentage hasn't changed
        if (type === 'total' && percentage === this.lastTotalPercentage) return;
        if (type === 'current' && percentage === this.lastCurrentPercentage) return;
        
        // Update cache
        if (type === 'total') {
            this.lastTotalPercentage = percentage;
        } else {
            this.lastCurrentPercentage = percentage;
        }
        
        // In synchronous mode (testing), update immediately
        if (this.synchronousMode) {
            this.setProgressBar(type, percentage);
            return;
        }
        
        // Throttle DOM updates using requestAnimationFrame
        const pendingUpdate = type === 'total' ? this.pendingTotalUpdate : this.pendingCurrentUpdate;
        if (pendingUpdate !== null) {
            return; // Update already scheduled
        }
        
        const animationFrame = requestAnimationFrame(() => {
            this.setProgressBar(type, percentage);
            if (type === 'total') {
                this.pendingTotalUpdate = null;
            } else {
                this.pendingCurrentUpdate = null;
            }
        });
        
        if (type === 'total') {
            this.pendingTotalUpdate = animationFrame;
        } else {
            this.pendingCurrentUpdate = animationFrame;
        }
    }

    /**
     * Enable synchronous mode for testing
     */
    setSynchronousMode(enabled: boolean): void {
        this.synchronousMode = enabled;
        
        // If disabling sync mode and there are pending updates, execute them now
        if (!enabled) {
            if (this.pendingCurrentUpdate !== null) {
                cancelAnimationFrame(this.pendingCurrentUpdate);
                this.pendingCurrentUpdate = null;
            }
            if (this.pendingTotalUpdate !== null) {
                cancelAnimationFrame(this.pendingTotalUpdate);
                this.pendingTotalUpdate = null;
            }
        }
    }
} 