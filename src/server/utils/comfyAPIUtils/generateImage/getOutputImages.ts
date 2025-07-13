import getHistory from "../getHistory";
import logger from "server/utils/logger";

// Add an explicit index signature for historyOutputs
interface HistoryOutputs {
    [nodeId: string]: {
        images?: Array<{ filename: string; subfolder: string; type: string }>;
        videos?: any[];
    };
}

async function getOutputImages(promptId: string, retryCount = 0): Promise<Record<string, string[]>> {
    async function generateProxiedImageUrl(filename: string, subfolder: string, folderType: string) {
        const params = new URLSearchParams({ filename, subfolder, type: folderType });

        return `/comfyui/image?${params.toString()}`;
    }

    const outputImages: Record<string, string[]> = {};

    try {
        const history = await getHistory(promptId);

        // Debug logging
        logger.logOptional('get_output_images', `History data for ${promptId}: ${JSON.stringify(history).substring(0, 200)}...`);

        // Check if the history data exists
        if (!history) {
            console.warn(`No history data found for prompt ID: ${promptId}`);
            return outputImages;
        }

        // The ComfyUI API might return the data directly or wrapped in an object
        // Try both formats to handle different API versions
        let historyOutputs: HistoryOutputs;
        
        if (history[promptId] && history[promptId].outputs) {
            // Wrapped format: { [promptId]: { outputs: {...} } }
            historyOutputs = history[promptId].outputs as HistoryOutputs;
            logger.logOptional('get_output_images', `Using wrapped format for ${promptId}`);
        } else if ((history as any).outputs) {
            // Direct format: { outputs: {...} }
            historyOutputs = (history as any).outputs as HistoryOutputs;
            logger.logOptional('get_output_images', `Using direct format for ${promptId}`);
        } else {
            // If no outputs found and we haven't retried yet, wait a bit and retry
            if (retryCount < 3) {
                logger.logOptional('get_output_images', `No outputs found for ${promptId}, retrying in 1 second (attempt ${retryCount + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return getOutputImages(promptId, retryCount + 1);
            }
            
            console.warn(`No outputs found in history data for prompt ID: ${promptId} after ${retryCount + 1} attempts`);
            return outputImages;
        }

        for (const nodeId in historyOutputs) {
            const nodeOutput = historyOutputs[nodeId];
            if (nodeOutput.images) {
                const imageUrls = await Promise.all(
                    nodeOutput.images.map(async (image) => {
                        return await generateProxiedImageUrl(image.filename, image.subfolder, image.type);
                    })
                );
                outputImages[nodeId] = imageUrls;
            }
        }

        logger.logOptional('get_output_images', `Found ${Object.values(outputImages).flat().length} images for ${promptId}`);
        return outputImages;
    } catch (error) {
        logger.logOptional('get_output_images', `Error getting output images for ${promptId}: ${error}`);
        
        // If we haven't retried yet, wait a bit and retry
        if (retryCount < 3) {
            logger.logOptional('get_output_images', `Retrying in 1 second (attempt ${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return getOutputImages(promptId, retryCount + 1);
        }
        
        throw error;
    }
}

export default getOutputImages;