import WebSocket from 'ws';

async function handleComfyWsClose(_clientWs: WebSocket) {
    // Nothing to do here on close
}

export default handleComfyWsClose;