export interface ProgressMessage {
    value: number;
    max: number;
    prompt_id?: string;
    node?: string;
}

export interface WorkflowStructureMessage {
    totalNodes: number;
    outputNodeCount: number;
    hasDependencies?: boolean;
    nodeTypes?: Record<string, number>;
    promptId?: string;
}

export interface PreviewMessage {
    mimetype: string;
    image: string;
}

export type FinishGenerationMessage = Record<string, string[]>;
