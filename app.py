from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# Ollama settings
OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen2.5:0.5b"

# EduBot ki personality aur rules
SYSTEM_PROMPT = """
You are EduBot, a specialized Education Assistant.

Your job is to help users with education-related topics.

You can answer questions about:
- School subjects
- College subjects
- Study techniques
- Exam preparation
- Teaching methods
- Learning strategies
- Homework help
- Career guidance related to education

IMPORTANT RULES:

1. Greet the user politely at the beginning.

2. Give specific, clear and relevant answers.

3. Remember the previous conversation and use context
   when answering follow-up questions.

4. If the user asks something unrelated to education,
   politely refuse and redirect them to education topics.

5. Do not provide harmful, illegal, dangerous or forbidden content.

6. Do not make up information. If you are not sure,
   clearly say that you are not sure.

7. Keep answers simple and easy to understand.

8. If the user says goodbye or wants to end the conversation,
   give a polite and friendly goodbye.

You are EduBot, an education-focused chatbot.
"""

# Conversation history
messages = [
    {
        "role": "system",
        "content": SYSTEM_PROMPT
    }
]


def chat_with_bot(user_message):

    messages.append({
        "role": "user",
        "content": user_message
    })

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "messages": messages,
                "stream": False
            }
        )

        response.raise_for_status()

        data = response.json()

        bot_message = data["message"]["content"]

        messages.append({
            "role": "assistant",
            "content": bot_message
        })

        return bot_message

    except requests.exceptions.ConnectionError:
        return "Sorry, Ollama se connection nahi ho raha. Please make sure Ollama is running."

    except Exception as error:
        return f"Something went wrong: {error}"


# ---------------------------------------------------------
# API ROUTE — this is what script.js calls
# ---------------------------------------------------------

@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "")

    if not user_message.strip():
        return jsonify({"error": "Empty message"}), 400

    reply = chat_with_bot(user_message)
    return jsonify({"reply": reply})


# ---------------------------------------------------------
# SERVE YOUR WEBSITE FILES (index.html, style.css, script.js)
# ---------------------------------------------------------

@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def serve_static_files(filename):
    return send_from_directory(".", filename)


if __name__ == "__main__":
    print("=" * 55)
    print("  EduBot server running at http://localhost:5000")
    print("  Make sure Ollama is running: ollama serve")
    print("=" * 55)
    app.run(port=5000, debug=True)