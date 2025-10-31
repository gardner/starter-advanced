# Web-LLM Integration Plan

## Current State Analysis

- We have a simple React app using Vite in the root directory
- The app currently only has a counter example
- We have an example Next.js app in `example-chat/` that demonstrates web-llm usage
- Both apps already have `@mlc-ai/web-llm` as a dependency

## Integration Approach

### 1. Component Structure
We'll create a more Vite-appropriate structure:
- Create a `useWebLLM` hook to encapsulate engine lifecycle and progress
- Create a `LlmChat` component to manage the UI state and rendering
- Replace the current counter example with the chat interface

### 2. File Organization
Create the following files in the React app:
- `src/lib/webllm.ts` - Helper function for dynamic engine creation
- `src/hooks/useWebLLM.ts` - Custom hook for web-llm engine management
- `src/components/LlmChat.tsx` - React component for the chat UI
- Update `src/App.tsx` to use the new chat component

### 3. Implementation Steps

1. **Create web-llm helper library** (`src/lib/webllm.ts`):
   - Implement dynamic import for `@mlc-ai/web-llm` to avoid importing at app entry
   - Create a function to instantiate the MLCEngine with progress callback

2. **Create custom hook** (`src/hooks/useWebLLM.ts`):
   - Encapsulate engine lifecycle management
   - Implement WebGPU feature detection with fallback messaging
   - Handle React 19 StrictMode double-invoke protection
   - Manage loading states, progress tracking, and error handling

3. **Create Chat Component** (`src/components/LlmChat.tsx`):
   - Implement UI based on the Next.js example but adapted for standard React
   - Add proper loading states and progress indicators
   - Include user input and message display functionality
   - Add reset/cancel controls

4. **Update App.tsx**:
   - Replace the counter example with the LlmChat component
   - Import necessary dependencies

5. **Add CSS styling**:
   - Create chat-specific styles
   - Adapt Tailwind classes from the Next.js example to standard CSS or implement Tailwind if not already present

6. **Configure Vite**:
   - Add code splitting configuration to keep web-llm in a separate chunk
   - Ensure proper production build settings

7. **Add metadata handling**:
   - Update `index.html` with appropriate title and meta tags
   - Optionally implement react-helmet-async for dynamic metadata updates

8. **Testing and Validation**:
   - Verify WebGPU feature detection works properly
   - Test engine initialization once even under React 19 StrictMode
   - Confirm code-splitting works and web-llm chunk is only requested on user action
   - Test model shard fetches succeed with CORS + Range
   - Verify functionality across supported browsers (Chrome/Edge latest, Safari 17+)

### 4. Technical Considerations

- **Browser Support**: WebGPU is required and not available in all browsers. Must implement feature detection.
- **Bundle Size**: web-llm is a heavy dependency that should be code-split and loaded on demand.
- **Model Loading**: First-time model download can take minutes. Need granular progress indicators.
- **React 19 Compatibility**: Handle StrictMode double-invoke to prevent duplicate engine initialization.
- **Vite vs Next.js**: No built-in Head component; use index.html or react-helmet-async for metadata.
- **Production Deployment**: Verify model hosting supports Range requests and proper CORS headers.

### 5. Model Selection

The example uses "Qwen3-0.6B-q4f16_1-MLC" which provides good quality but has a large download size. Consider starting with smaller models for better UX:
- "Llama-3-8B-Instruct-q4f32_1-MLC" (default recommendation)
- "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC-1k" for faster loading/execution
- Use environment variables to make model selection configurable

### 6. Performance Optimization

- Implement code splitting to keep web-llm out of the main bundle
- Add explicit "Load model" button so users opt into the download
- Defer engine creation until explicitly needed
- Provide cancel/reset functionality during initialization
- Consider using smaller quantized models for acceptable first-load times