import { WebContainer } from '@webcontainer/api';

let webContainerPromise = null;

export const getWebContainer = async () => {
    if (webContainerPromise === null) {
        webContainerPromise = WebContainer.boot();
    }
    return webContainerPromise;
}