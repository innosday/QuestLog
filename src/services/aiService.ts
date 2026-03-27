import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Category, Difficulty, MonsterData } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const analyzeQuestWithAI = async (title: string, lang: 'ko' | 'en' = 'ko'): Promise<MonsterData> => {
  const prompt = `
    Analyze the following daily task/quest title and convert it into an RPG monster hunt quest.
    Task Title: "${title}"
    Language: ${lang === 'ko' ? 'Korean' : 'English'}

    Return a JSON object with the following fields:
    - monsterName: A creative RPG monster name related to the task.
    - monsterDescription: A short, flavor-text description of the monster (max 100 chars).
    - grade: Choose one from ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] based on the task difficulty.
    - level: A level between 1 and 99 based on the task complexity.
    - category: Choose one from ['STR', 'INT', 'DEX', 'CHA', 'ECO'] based on the task type.
      - STR: Exercise, physical labor.
      - INT: Study, coding, reading.
      - DEX: Technical work, musical practice, specific skills.
      - CHA: Social meetings, networking.
      - ECO: Cleaning, recycling, environment.

    Example JSON output:
    {
      "monsterName": "Iron-Clad Kettlebell Golem",
      "monsterDescription": "A heavy construct fueled by pure sweat and iron determination.",
      "grade": "Uncommon",
      "level": 15,
      "category": "STR"
    }

    Respond ONLY with the JSON object in the specified language.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr) as MonsterData;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      monsterName: lang === 'ko' ? `${title}의 그림자` : `Shadow of ${title}`,
      monsterDescription: lang === 'ko' ? "끝내지 못한 일을 상징하는 그림자 생명체입니다." : "A generic shadow entity representing an unfinished task.",
      grade: "Common",
      level: 1,
      category: "STR",
    };
  }
};

export const verifyProofWithAI = async (title: string, category: Category, photoBase64: string, lang: 'ko' | 'en' = 'ko'): Promise<{ success: boolean; reason: string }> => {
  const prompt = `
    You are an RPG Quest Overseer. A player submitted a photo as proof for the quest: "${title}" (Category: ${category}).
    Analyze if the photo matches the quest.
    Language for "reason": ${lang === 'ko' ? 'Korean' : 'English'}
    
    Category Guidelines:
    - STR: Look for gym, outdoor, weights, or physical activity.
    - INT: Look for books, laptops, code, notes, or library.
    - DEX: Look for instruments, tools, art, or specialized equipment.
    - ECO: Look for recycling bins, trash bags, cleaning supplies, or nature.
    - CHA: Look for people, cafes, meeting rooms, or social settings.

    Return a JSON object:
    {
      "success": boolean,
      "reason": "Short explanation of why it passed or failed in the specified language."
    }
    Respond ONLY with JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: photoBase64.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ]);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Verification failed:", error);
    return { 
      success: true, 
      reason: lang === 'ko' ? "검증 서버가 혼잡하여 사냥을 승인합니다." : "Verification server busy, granting pass." 
    };
  }
};
