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

export interface WorkflowNode {
    id: string;
    class_type: string;
    inputs: Record<string, any>;
}

interface NodeDependencyInfo {
    id: string;
    dependencies: string[];
    dependents: string[];
    depth: number;
}

export class ProgressBarManager {
    private elements: ProgressBarElements;
    private workflow: Workflow | null = null;
    private totalNodes: number = 0;
    private completedNodes: number = 0;
    private currentNodeProgress: number = 0;
    private currentNodeMax: number = 1;
    private nodeDepthMap: Map<string, NodeDependencyInfo> = new Map();
    private maxDepth: number = 0;
    private currentNodeId: string | null = null;
    
    // Cached values for performance optimization
    private cachedAverageDepth: number | null = null;
    private cachedHasDependencies: boolean | null = null;
    private cachedComplexityMetrics: {
        baseMultiplier: number;
        complexityBoost: number;
    } | null = null;
    
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
     * Analyzes the workflow to build a dependency graph and calculate node depths
     * Optimized version with iterative depth calculation and caching
     */
    private analyzeWorkflowStructure(workflow: Workflow): void {
        this.nodeDepthMap.clear();
        this.maxDepth = 0;
        this.invalidateCache();

        const nodeMap = new Map<string, NodeDependencyInfo>();
        
        // First pass: identify all nodes and their direct dependencies
        // Optimized to avoid redundant array operations
        for (const [nodeId, node] of Object.entries(workflow)) {
            const dependencies: string[] = [];
            
            // Analyze inputs to find dependencies - optimized loop
            if (node.inputs) {
                const inputEntries = Object.values(node.inputs);
                for (let i = 0; i < inputEntries.length; i++) {
                    const inputValue = inputEntries[i];
                    if (Array.isArray(inputValue) && inputValue.length >= 2) {
                        const dependencyNodeId = inputValue[0];
                        if (typeof dependencyNodeId === 'string' && workflow[dependencyNodeId]) {
                            dependencies.push(dependencyNodeId);
                        }
                    }
                }
            }

            nodeMap.set(nodeId, {
                id: nodeId,
                dependencies,
                dependents: [],
                depth: 0
            });
        }

        // Second pass: build dependent relationships
        for (const nodeInfo of nodeMap.values()) {
            const deps = nodeInfo.dependencies;
            for (let i = 0; i < deps.length; i++) {
                const depNode = nodeMap.get(deps[i]);
                if (depNode) {
                    depNode.dependents.push(nodeInfo.id);
                }
            }
        }

        // Third pass: calculate depths using iterative topological sort (more efficient than recursion)
        this.calculateDepthsIteratively(nodeMap);
        
        this.nodeDepthMap = nodeMap;
        
        // Pre-calculate and cache expensive operations
        this.precomputeMetrics();
    }

    /**
     * Optimized iterative depth calculation to avoid recursion overhead
     */
    private calculateDepthsIteratively(nodeMap: Map<string, NodeDependencyInfo>): void {
        const inDegree = new Map<string, number>();
        const queue: string[] = [];
        
        // Initialize in-degrees
        for (const [nodeId, nodeInfo] of nodeMap.entries()) {
            inDegree.set(nodeId, nodeInfo.dependencies.length);
            if (nodeInfo.dependencies.length === 0) {
                queue.push(nodeId);
                nodeInfo.depth = 0;
            }
        }
        
        // Process nodes level by level
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            const nodeInfo = nodeMap.get(nodeId)!;
            
            // Update depths of dependent nodes
            for (const dependentId of nodeInfo.dependents) {
                const dependentInfo = nodeMap.get(dependentId)!;
                dependentInfo.depth = Math.max(dependentInfo.depth, nodeInfo.depth + 1);
                this.maxDepth = Math.max(this.maxDepth, dependentInfo.depth);
                
                // Decrease in-degree and add to queue if ready
                const newInDegree = inDegree.get(dependentId)! - 1;
                inDegree.set(dependentId, newInDegree);
                if (newInDegree === 0) {
                    queue.push(dependentId);
                }
            }
        }
    }

    /**
     * Pre-compute expensive metrics once to avoid recalculation
     */
    private precomputeMetrics(): void {
        // Cache average depth
        if (this.nodeDepthMap.size > 0) {
            let totalDepth = 0;
            for (const nodeInfo of this.nodeDepthMap.values()) {
                totalDepth += nodeInfo.depth;
            }
            this.cachedAverageDepth = totalDepth / this.nodeDepthMap.size;
        } else {
            this.cachedAverageDepth = 0;
        }
        
        // Cache dependency detection - properly check if any node has dependencies
        this.cachedHasDependencies = false;
        if (this.nodeDepthMap.size > 0) {
            for (const nodeInfo of this.nodeDepthMap.values()) {
                if (nodeInfo.dependencies.length > 0) {
                    this.cachedHasDependencies = true;
                    break;
                }
            }
        }
        

        
        // Cache complexity metrics
        if (this.cachedAverageDepth !== null && this.maxDepth > 0) {
            const depthComplexity = this.cachedAverageDepth / this.maxDepth;
            this.cachedComplexityMetrics = {
                baseMultiplier: 1.0 + (depthComplexity * 0.8),
                complexityBoost: this.maxDepth > 1 ? 1.0 + (this.maxDepth / this.totalNodes) : 1.0
            };
        } else {
            this.cachedComplexityMetrics = {
                baseMultiplier: 1.0,
                complexityBoost: 1.0
            };
        }
    }

    /**
     * Invalidate cached values when workflow changes
     */
    private invalidateCache(): void {
        this.cachedAverageDepth = null;
        this.cachedHasDependencies = null;
        this.cachedComplexityMetrics = null;
    }

    /**
     * Updates the total progress based on workflow structure and current node progress
     * Optimized to use cached values and reduce calculations
     */
    private updateTotalProgress(): void {
        if (this.totalNodes === 0) return;

        let totalProgress: number;

        // Use cached dependency detection (much faster than checking every time)
        const hasAnyDependencies = this.cachedHasDependencies ?? false;



        if (hasAnyDependencies) {
            // Use structure-aware progress calculation for complex workflows
            const completedProgress = this.completedNodes / this.totalNodes;
            const currentNodeProgress = this.currentNodeMax > 0 ? 
                (this.currentNodeProgress / this.currentNodeMax) / this.totalNodes : 0;
            
            // Calculate base progress
            let baseProgress = completedProgress + currentNodeProgress;
            
                        // If we're processing a node, add its completed dependencies to the progress
            if (this.currentNodeId) {
                const completedDependencies = this.getCompletedDependenciesForNode(this.currentNodeId);
                baseProgress += completedDependencies / this.totalNodes;
            }
            
            // Apply a multiplier for workflows with dependencies
            const dependencyMultiplier = this.calculateDependencyMultiplierOptimized();
            totalProgress = Math.min(baseProgress * dependencyMultiplier, 1);
            

            

        } else {
            // Fallback to simple calculation for workflows without dependencies
            const completedProgress = this.completedNodes / this.totalNodes;
            const currentNodeProgress = this.currentNodeMax > 0 ? 
                (this.currentNodeProgress / this.currentNodeMax) / this.totalNodes : 0;
            totalProgress = Math.min(completedProgress + currentNodeProgress, 1);
            

        }
        
        const totalPercentage = `${Math.round(totalProgress * 100)}%`;

        this.setProgressBarOptimized('total', totalPercentage);
    }

        /**
     * Gets the number of completed dependencies for a given node
     * @param nodeId The ID of the node to check dependencies for
     * @returns The number of completed dependencies
     */
    private getCompletedDependenciesForNode(nodeId: string): number {
        const nodeInfo = this.nodeDepthMap.get(nodeId);
        if (!nodeInfo) {
            return 0;
        }
        
        // Count dependencies that are at a lower depth (already processed)
        let completedDependencies = 0;
        for (const depId of nodeInfo.dependencies) {
            const depInfo = this.nodeDepthMap.get(depId);
            if (depInfo && depInfo.depth < nodeInfo.depth) {
                completedDependencies++;
            }
        }
        return completedDependencies;
    }

    /**
     * Optimized multiplier calculation using cached values
     */
    private calculateDependencyMultiplierOptimized(): number {
        // Only apply multiplier if we have a current node (indicating we're processing a node)
        if (!this.currentNodeId) {
            return 1.0; // No multiplier if no current node
        }
        
        const currentProgressRatio = this.currentNodeMax > 0 ? 
            (this.currentNodeProgress / this.currentNodeMax) : 0;
        
        // Use cached complexity metrics (much faster than recalculating)
        const metrics = this.cachedComplexityMetrics!;
        
        // Calculate progress multiplier - use a minimum multiplier even when progress is 0
        const progressMultiplier = 1.0 + (currentProgressRatio * 0.6);
        
        return Math.min(metrics.baseMultiplier * progressMultiplier * metrics.complexityBoost, 2.0);
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
        this.currentNodeId = null;
        
        // Analyze workflow structure for better progress tracking
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
        this.completedNodes = 0;
        this.currentNodeProgress = 0;
        this.currentNodeMax = 1;
        this.currentNodeId = null;
        this.nodeDepthMap.clear();
        this.maxDepth = 0;
        
        // Clear all caches
        this.invalidateCache();
        this.lastTotalPercentage = '';
        this.lastCurrentPercentage = '';
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
        this.currentNodeId = messageData.node || null;

        // Update current node label
        this.updateCurrentNodeLabel();

        // Update current node progress
        const currentProgress = this.currentNodeMax > 0 ? 
            `${Math.round((this.currentNodeProgress / this.currentNodeMax) * 100)}%` : '0%';
        this.setProgressBarOptimized('current', currentProgress);

        // Check if current node is complete
        if (this.currentNodeProgress >= this.currentNodeMax && this.currentNodeMax > 0) {
            this.completedNodes += 1;
            this.completedNodes = Math.min(this.completedNodes, this.totalNodes);
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

    /**
     * Gets the display name for a node
     * @param nodeId The node ID
     * @returns The display name (title or class_type)
     */
    private getNodeDisplayName(nodeId: string): string {
        if (!this.workflow || !this.workflow[nodeId]) {
            return nodeId;
        }
        
        const node = this.workflow[nodeId];
        // Use title if available, otherwise use class_type
        return node._meta?.title || node.class_type || nodeId;
    }

    /**
     * Updates the current node progress label
     */
    private updateCurrentNodeLabel(): void {
        if (!this.elements.current.labelElem) {
            return; // Element doesn't exist (e.g., in test environment)
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
     * Call this when the progress bar manager is no longer needed
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
        this.nodeDepthMap.clear();
        this.workflow = null;
        
        // Clear caches
        this.invalidateCache();
        
        // Reset state
        this.totalNodes = 0;
        this.completedNodes = 0;
        this.currentNodeProgress = 0;
        this.currentNodeMax = 1;
        this.currentNodeId = null;
        this.maxDepth = 0;
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