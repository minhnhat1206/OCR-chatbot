```markdown
Hello Claude,

I have successfully scaffolded a beautiful, responsive React + Tailwind CSS chat interface on my local machine at `C:\Users\user\Desktop\Best HR Solutions\chat-ui`. Its purpose is to serve as a user-friendly frontend to demo our AI agent capabilities before we scale it into a broader system.

Right now, the UI is completely finished. It has local storage memory and a modern glassmorphism design. It sends `POST` requests containing `{ sessionId, chatInput }`, and expects a string or `{ output: "AI response" }` JSON back.

**YOUR OBJECTIVE:**
I want you to connect our n8n workflow named **"RAG chatbot -n8n webhook"** to this new React frontend.

**REQUIREMENTS FOR YOU:**

1. **n8n Workflow Re-Design:**
   - Review or modify the "RAG chatbot -n8n webhook" workflow so its entry point is an n8n Webhook Node (Method POST).
   - Ensure the Webhook parses the incoming Body JSON: `{{ $json.body.chatInput }}` and `{{ $json.body.sessionId }}`.
   - Ensure the workflow's final node (Webhook Response) correctly returns the AI's answer back to the React app in a format like `{ "output": "the AI's text response" }` (or similar).
   - IMPORTANT: Webhooks hit by React `fetch` will face CORS errors if not configured. Ensure the n8n webhook node is configured to respond to CORS Preflight OPTIONS requests (this usually means creating a parallel Webhook node listening to OPTIONS and responding with 200 OK headers `Access-Control-Allow-Origin: *`, or checking if n8n cloud allows CORS by default).

2. **Automated Integration Script (Python):**
   - We need to seamlessly connect the React app to the new Webhook Production URL.
   - Please write a Python script that targets the file `C:\Users\user\Desktop\Best HR Solutions\chat-ui\src\App.jsx`.
   - The script should ask me for the n8n Webhook ID (or full URL) in the CLI, and then use Regex/String Replacement to find the exact line: 
     `const WEBHOOK_URL = ''; // <-- Dán URL n8n Webhook của bạn vào đây`
   - It should replace the empty string with the actual valid Production Webhook URL.

Please provide the instructions step-by-step so we can establish a seamless full-stack connection between our local React frontend and the cloud n8n RAG AI.
```
