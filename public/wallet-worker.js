// Web Worker for wallet connection to avoid extension conflicts
self.onmessage = async function(e) {
  if (e.data.type === 'connectWallet') {
    try {
      // This worker runs in isolation, so extension conflicts are less likely
      const result = await connectWalletInWorker();
      self.postMessage({ type: 'success', data: result });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
    }
  }
};

async function connectWalletInWorker() {
  // In a worker, we can't directly access window.ethereum
  // So we'll return a message to the main thread to handle the actual connection
  return { message: 'Please connect wallet from main thread' };
} 