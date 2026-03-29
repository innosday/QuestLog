import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Category, MonsterData, Stats } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

/**
 * 🛡️ Multi-Model AI Service (Rotation Strategy)
 * Uses the ultra-fast /p/ endpoint with the turbo model for near-instant loading.
 */
export const analyzeQuestWithAI = async (title: string, lang: 'ko' | 'en' = 'ko'): Promise<MonsterData> => {
  console.log(`[AI] ⚔️ Summoning: "${title}"`);
  
  const prompt = `
    Analyze: "${title}". Target: MONSTROUS BEAST (Non-human).
    Return ONLY JSON: {
      "monsterName": "Name",
      "monsterNameEn": "NameEn",
      "monsterDescription": "Short text",
      "grade": "Common"|"Uncommon"|"Rare"|"Epic"|"Legendary",
      "level": 1-99,
      "category": "STR"|"INT"|"DEX"|"CHA"|"ECO",
      "visual": "2-3 beastly English adjectives"
    }
    Language: ${lang}.
  `;

  const modelsToTry = ["gemini-3-flash-preview", "gemini-2.5-flash"];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const resultText = result.response.text();
      
      const start = resultText.indexOf('{');
      const end = resultText.lastIndexOf('}');
      const data = JSON.parse(resultText.substring(start, end + 1));

      // 🛡️ REFINED IMAGE ENGINE (Using 'image' path as requested)
      const cleanName = (data.monsterNameEn || "Ancient Beast").replace(/[^a-zA-Z ]/g, "").trim();
      const seed = Math.floor(Math.random() * 1000000);
      const rawPrompt = encodeURIComponent(`${cleanName}, ${data.visual || "monstrous"}, dark fantasy rpg monster, portrait`);
      
      // Using gen.pollinations.ai/image/ with turbo for the perfect balance of format and speed
      const monsterImageUrl = `https://gen.pollinations.ai/image/${rawPrompt}?model=turbo&width=512&height=512&seed=${seed}&enhance=false&nologo=true`;

      console.log(`[AI] ✅ Success with ${modelName}. Monster: ${data.monsterName}`);
      
      return {
        monsterName: data.monsterName,
        monsterDescription: data.monsterDescription,
        grade: data.grade,
        level: data.level,
        category: data.category,
        monsterImageUrl
      };
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 429) {
        continue;
      }
    }
  }

  // 🎲 Deterministic Local Fallback
  return {
    monsterName: lang === 'ko' ? `${title}의 수호야수` : `Beast of ${title}`,
    monsterDescription: "심연에서 올라온 고대의 괴수입니다.",
    grade: 'Rare',
    level: 25,
    category: 'STR',
    monsterImageUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(title)}&backgroundColor=fdf6e3`
  };
};

/**
 * 👁️ Vision Verification: Analyze proof image vs quest target.
 */
export const verifyProofWithAI = async (title: string, category: Category, photoBase64: string, lang: 'ko' | 'en' = 'ko'): Promise<{ success: boolean; reason: string }> => {
  console.log(`[AI] 👁️ Scanning Proof for: "${title}"`);

  // Handle Base64 properly (remove prefix if present)
  const base64Data = photoBase64.split(',')[1] || photoBase64;
  
  const prompt = `
    Analyze this image as proof for the quest: "${title}" (Category: ${category}).
    Criteria:
    1. Does the image show actual evidence of the task completion?
    2. Is it a real-world photo? (Reject if it's a screenshot of text, a monitor, or obviously fake).
    3. Does it match the essence of "${title}"?

    Return ONLY JSON: {
      "success": boolean,
      "reason": "Short explanation in ${lang}"
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);
    
    const resultText = result.response.text();
    const start = resultText.indexOf('{');
    const end = resultText.lastIndexOf('}');
    const data = JSON.parse(resultText.substring(start, end + 1));

    return {
      success: data.success,
      reason: data.reason
    };
  } catch (error) {
    console.error("[AI] Vision Error:", error);
    return {
      success: true, // Fail-safe: allow if AI is down
      reason: lang === 'ko' ? "AI 분석에 실패했지만, 증거가 제출되었습니다." : "AI analysis failed, but proof was submitted."
    };
  }
};

/**
 * 🔮 Oracle Strategy: Suggest quests based on user stats & preference.
 */
export const suggestQuestsWithAI = async (stats: Stats, lang: 'ko' | 'en' = 'ko'): Promise<string[]> => {
  console.log(`[AI] 🔮 Consulting the Oracle...`);

  const prompt = `
    Based on the user's RPG stats:
    STR (Strength): ${stats.str}, INT (Intelligence): ${stats.int}, DEX (Dexterity): ${stats.dex}, CHA (Charisma): ${stats.cha}, ECO (Economy/Env): ${stats.eco}.
    
    Suggest 3 unique, real-life "Quest" titles that would help improve their weakest stats or challenge their strongest.
    Quests should be actionable in the real world (e.g., "5km morning run", "Read 50 pages of a book", "Organize workspace").
    
    Return ONLY a JSON array of strings: ["Quest 1", "Quest 2", "Quest 3"].
    Language: ${lang === 'ko' ? 'Korean' : 'English'}.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const resultText = result.response.text();
    
    const start = resultText.indexOf('[');
    const end = resultText.lastIndexOf(']');
    return JSON.parse(resultText.substring(start, end + 1));
  } catch (error) {
    console.error("[AI] Oracle Error:", error);
    return lang === 'ko' 
      ? ["1km 조깅하기", "명상 10분 하기", "오늘의 할 일 정리하기"]
      : ["1km Jogging", "10 min Meditation", "Plan your day"];
  }
};
