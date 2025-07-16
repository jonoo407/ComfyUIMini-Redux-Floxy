/**
 * Common utility functions used across multiple modules
 */

/**
 * Sanitizes a node ID for use in CSS selectors by replacing invalid characters.
 * @param nodeId The node ID to sanitize
 * @returns A sanitized version safe for use in CSS selectors
 */
export function sanitizeNodeId(nodeId: string): string {
    return nodeId.replace(/[:]/g, '_');
}

/**
 * Generates a consistent input ID format used across the application
 * @param nodeId The node ID
 * @param inputName The input name within the node
 * @returns A formatted input ID
 */
export function generateInputId(nodeId: string, inputName: string): string {
    return `input-${sanitizeNodeId(nodeId)}-${inputName}`;
} 