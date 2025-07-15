export interface ProgressMessage {
    value: number;
    max: number;
    prompt_id?: string;
    node?: string;
}

export interface WorkflowStructureMessage {
    totalNodes: number;
    workflow: any; // The complete workflow structure for dependency analysis
    promptId?: string;
}

export interface PreviewMessage {
    mimetype: string;
    image: string;
}

export interface NodeExecutingMessage {
    node: string;
    display_node: string;
    prompt_id: string;
}

export interface NodeExecutedMessage {
    node: string;
    display_node: string;
    output: any; // Node output data can vary by node type
    prompt_id: string;
}

export type FinishGenerationMessage = Record<string, string[]>;
