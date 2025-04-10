document.addEventListener("DOMContentLoaded", () => {
  const circle = document.getElementById("voiceBtn");
  const userText = document.getElementById("userText");
  const botReply = document.getElementById("botReply");

  if (!circle || !userText || !botReply) {
    console.error("Missing DOM elements. Check your HTML.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";  // Change to English (US) language
  recognition.interimResults = false;

  const OPENROUTER_API_KEY = "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"; // 🔁 Replace with your OpenRouter API key
  if (!OPENROUTER_API_KEY) {
    console.error("Missing OpenRouter API key. Please set it in the script.");
    return;
  }

  const messages = [
    {
      role: "system",
      content: "You are a compassionate and understanding mental health assistant. Your goal is to provide emotional support, guidance, and comfort in a non-judgmental and empathetic manner. When responding, always remain patient, kind, and gentle, using language that fosters a safe and open environment. Prioritize active listening, validate the user's feelings, and offer encouragement and understanding. Your responses should be clear, concise, and focused on offering helpful advice or comforting words. Avoid overwhelming the user with lengthy explanations; instead, offer short, meaningful insights or suggestions. Keep your replies under 30 words to maintain clarity and brevity. If the user expresses distress, acknowledge their feelings and offer reassurance, making them feel heard and supported. If necessary, suggest resources for further support or professional help. Your aim is to empower users to feel heard, understood, and capable of managing their emotions with confidence."
    }
  ];

  let isListening = false;

  circle.addEventListener("click", () => {
    if (isListening) return;

    isListening = true;
    recognition.start();
    userText.textContent = "⏳ Listening...";
    botReply.textContent = "";
  });

  recognition.onresult = async (event) => {
    const userMessage = event.results[0][0].transcript;
    userText.textContent = `🗣️ ${userMessage}`;
    messages.push({ role: "user", content: userMessage });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct", // ✅ Free model on OpenRouter
          messages: messages
        })
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "I didn't understand that. Could you please say it again?";
      messages.push({ role: "assistant", content: reply });

      botReply.textContent = `🤖 ${reply}`;

      // Check if responsiveVoice is available and speak the reply in English
      if (typeof responsiveVoice !== "undefined" && responsiveVoice.voiceSupport()) {
        responsiveVoice.speak(reply, "UK English Male"); // Change to English voice
      } else {
        console.warn("Voice not supported. Here's the reply:", reply);
      }

    } catch (error) {
      console.error("Error talking to OpenRouter:", error);
      botReply.textContent = "❌ There was an issue with the response. Please try again.";
    }

    isListening = false;
  };

  recognition.onerror = (e) => {
    console.error("Recognition error:", e);
    userText.textContent = "❌ There was an issue with listening.";
    isListening = false;
  };
});
