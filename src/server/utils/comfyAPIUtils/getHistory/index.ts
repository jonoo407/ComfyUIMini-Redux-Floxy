import { HistoryResponse } from '@shared/types/History';
import { comfyUIAxios } from '../comfyUIAxios';
import logger from "server/utils/logger";

async function getHistory(promptId: string): Promise<HistoryResponse> {
    const response = await comfyUIAxios.get(`/history/${promptId}`);
    
    logger.logOptional('fetch_history', `Fetch: ${promptId}`);

    return response.data;
}

export default getHistory;
