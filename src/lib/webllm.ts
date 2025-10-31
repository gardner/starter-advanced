/**
 * Helper functions for Web-LLM integration
 * AIDEV-NOTE: This file handles dynamic imports and engine creation to optimize bundle size
 */

export interface ProgressCallback {
  (progress: { text: string; progress?: number }): void;
}

/**
 * Dynamically imports and creates a Web-LLM engine
 * This function ensures the web-llm library is only loaded when needed
 */
export async function createEngine(
  modelId: string,
  onProgress?: ProgressCallback
) {
  console.log("createEngine called with modelId:", modelId);
  const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
  console.log("Web-LLM imported successfully");
  
  // Create engine first
  const engine = await CreateMLCEngine(modelId);
  console.log("Engine created successfully");
  
  // Then set progress callback
  if (onProgress) {
    engine.setInitProgressCallback((p: { text: string; progress?: number }) => {
      console.log("Progress callback triggered:", p);
      onProgress(p);
    });
  }
  
  // Reload the model to trigger progress callback
  await engine.reload(modelId);
  console.log("Model reloaded");
  
  return engine;
}

/**
 * Checks if WebGPU is supported in the current browser
 */
export function checkWebGPUSupport(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as any).gpu;
}

/**
 * Gets browser compatibility information
 */
export function getBrowserCompatibility() {
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isEdge = /Edg/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  
  return {
    hasWebGPU: checkWebGPUSupport(),
    isChrome,
    isEdge,
    isSafari,
    isFirefox,
    userAgent,
  };
}