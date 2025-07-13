import logger from "server/utils/logger";
import getOutputImages from "./getOutputImages";
import WebSocket from "ws";

async function sendCachedImages(clientWs: WebSocket, promptId: string) {
    try {
        logger.logOptional('generation_finish', 'Using cached generation result.');

        const cachedImages = await getOutputImages(promptId);

        // Check if we got any images back
        const totalImages = Object.values(cachedImages).flat().length;
        
        if (totalImages === 0) {
            logger.logOptional('generation_finish', 'No cached images found for prompt ID: ' + promptId);
            clientWs.send(JSON.stringify({ type: 'error', message: 'No cached images found for this generation. The image may still be processing or the cache may have been cleared.' }));
            return;
        }

        clientWs.send(JSON.stringify({ type: 'total_images', data: totalImages }));
        clientWs.send(JSON.stringify({ type: 'completed', data: cachedImages }));
        
        logger.logOptional('generation_finish', `Successfully sent ${totalImages} cached images for prompt ID: ${promptId}`);
    } catch (error) {
        logger.logOptional('generation_finish', 'Error retrieving cached images: ' + error);
        clientWs.send(JSON.stringify({ type: 'error', message: 'Failed to retrieve cached images. Please try running the workflow again.' }));
    }
}

export default sendCachedImages;