export interface ObjectInfoPartial {
    [nodeType: string]: {
        input: {
            required?: {
                [inputName: string]: any;
            };
            optional?: {
                [inputName: string]: any;
            };
        };
    };
}

export interface NormalisedComfyInputInfo {
    type: 'ARRAY' | 'STRING' | 'INT' | 'FLOAT' | 'BOOLEAN';
    userAccessible: boolean;
    list: string[];
    default?: string;
    tooltip?: string;
    imageUpload?: boolean;
    min?: number;
    max?: number;
    step?: number;
    multiline?: boolean;
    dynamicPrompts?: boolean;
}

export interface ProcessedObjectInfo {
    [nodeName: string]: {
        [inputName: string]: NormalisedComfyInputInfo;
    };
}
