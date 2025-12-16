from ai.config import ai_config
import google.generativeai as genai

print(f"Key: {ai_config.GEMINI_API_KEY[:5]}...")

try:
    genai.configure(api_key=ai_config.GEMINI_API_KEY)
    print("Listing available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
