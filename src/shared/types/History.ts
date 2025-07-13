export interface HistoryResponse {
    [promptId: string]: {
        outputs: {
            [nodeId: string]: {
                images?: ImageInfo[];
                videos?: VideoInfo[];
            };
        };
    };
}

export interface ImageInfo {
    filename: string;
    subfolder: string;
    type: 'output' | 'input' | 'temp';
}

export interface VideoInfo {
    filename: string;
    subfolder: string;
    type: 'output' | 'input' | 'temp';
    format: string;
    frame_rate: number;
    fullpath: string;
}

// Queue-related types
export interface QueueItem {
    [0]: any;
    [1]: string; // promptId
    [2]: any;
    workflowName?: string; // Optional workflow name
}

export interface HistoryOutput {
    images?: Array<{
        filename: string;
        subfolder: string;
        type: string;
    }>;
    videos?: Array<{
        filename: string;
        subfolder: string;
        type: string;
        format: string;
        frame_rate: number;
        fullpath: string;
    }>;
}

export interface HistoryData {
    [promptId: string]: {
        outputs: {
            [key: string]: HistoryOutput;
        };
    };
}

export interface MediaItem {
    url: string;
    isVideo: boolean;
    filename: string;
}
