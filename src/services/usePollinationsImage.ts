import { useMemo } from 'react';

interface Options {
  width: number;
  height: number;
  seed: number;
  model: string;
  nologo: boolean;
  enhance?: boolean;
}

/**
 * 🚀 High-performance Port of the Pollinations Image Hook
 * Bypasses library conflicts while maintaining identical functionality.
 */
export function usePollinationsImage(prompt: string, options: Options): string {
  const imageUrl = useMemo(() => {
    if (!prompt) return '';
    
    const pollKey = import.meta.env.VITE_POLLINATIONS_API_KEY || "";
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Using the exact official pattern that worked in your cat test
    return `https://gen.pollinations.ai/image/${encodedPrompt}?model=${options.model}&width=${options.width}&height=${options.height}&seed=${options.seed}&enhance=${options.enhance ? 'true' : 'false'}${pollKey ? `&key=${pollKey}` : ''}`;
  }, [prompt, options.width, options.height, options.seed, options.model, options.enhance]);

  return imageUrl;
}

