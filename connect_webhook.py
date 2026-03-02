"""
Best HR Solutions — Webhook Connector Script
=============================================
Connects the React chat-ui frontend to the n8n RAG chatbot webhook.

Usage:
    python connect_webhook.py

The script will:
1. Ask you for the n8n Webhook Production URL (or just the webhook ID)
2. Update src/App.jsx with the correct WEBHOOK_URL
3. Verify the connection by sending a test request
"""

import re
import sys
import os

APP_JSX_PATH = os.path.join(os.path.dirname(__file__), "src", "App.jsx")
N8N_WEBHOOK_BASE = "https://minhnhat.app.n8n.cloud/webhook/legal-chatbot"

TARGET_LINE_PATTERN = r"const WEBHOOK_URL\s*=\s*'[^']*'\s*;"


def main():
    # --- Step 1: Check App.jsx exists ---
    if not os.path.isfile(APP_JSX_PATH):
        print(f"[ERROR] File not found: {APP_JSX_PATH}")
        print("Make sure you run this script from the chat-ui directory.")
        sys.exit(1)

    print("=" * 60)
    print("  Best HR Solutions — Webhook Connector")
    print("=" * 60)
    print()
    print("This script will connect your React chat-ui to the")
    print("n8n RAG chatbot webhook.")
    print()

    # --- Step 2: Get webhook URL from user ---
    print("Enter one of the following:")
    print("  1. Full webhook URL (e.g. https://xxx.app.n8n.cloud/webhook/legal-chatbot)")
    print("  2. Just the path (e.g. legal-chatbot)")
    print()
    user_input = input("Webhook URL or path: ").strip()

    if not user_input:
        print("[ERROR] No input provided. Exiting.")
        sys.exit(1)

    # Determine the full URL
    if user_input.startswith("http://") or user_input.startswith("https://"):
        webhook_url = user_input
    else:
        # Treat as path — append to base URL
        path = user_input.lstrip("/")
        webhook_url = f"{N8N_WEBHOOK_BASE}/{path}"

    print(f"\nWebhook URL: {webhook_url}")

    # --- Step 3: Read App.jsx ---
    with open(APP_JSX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # --- Step 4: Find and replace the WEBHOOK_URL line ---
    match = re.search(TARGET_LINE_PATTERN, content)
    if not match:
        print("[ERROR] Could not find the WEBHOOK_URL declaration in App.jsx.")
        print("Expected pattern: const WEBHOOK_URL = '...';")
        sys.exit(1)

    old_line = match.group(0)
    new_line = f"const WEBHOOK_URL = '{webhook_url}';"

    if old_line == new_line:
        print("\n[INFO] WEBHOOK_URL is already set to this URL. No changes needed.")
    else:
        content = content.replace(old_line, new_line, 1)

        with open(APP_JSX_PATH, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"\n[OK] Updated App.jsx:")
        print(f"  Old: {old_line}")
        print(f"  New: {new_line}")

    # --- Step 5: Also update the status text ---
    status_old = "Đang kết nối Webhook"
    status_new = "Online"

    if status_old in content:
        content = content.replace(status_old, status_new, 1)
        with open(APP_JSX_PATH, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  Status text: '{status_old}' → '{status_new}'")

    # --- Step 6: Test the webhook (optional) ---
    print()
    test = input("Send a test request to verify the webhook? (y/n): ").strip().lower()
    if test == "y":
        try:
            import urllib.request
            import json

            test_payload = json.dumps({
                "sessionId": "test-connection",
                "chatInput": "Xin chào"
            }).encode("utf-8")

            req = urllib.request.Request(
                webhook_url,
                data=test_payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            print(f"\nSending POST to {webhook_url}...")
            with urllib.request.urlopen(req, timeout=60) as resp:
                status = resp.status
                body = resp.read().decode("utf-8")

            print(f"  Status: {status}")
            if status == 200:
                data = json.loads(body)
                output = data.get("output", body[:200])
                print(f"  Response: {output[:300]}...")
                print("\n[SUCCESS] Webhook is working! Start your React app with:")
                print("  npm run dev")
            else:
                print(f"  Body: {body[:300]}")
                print("\n[WARNING] Unexpected status code. Check the n8n workflow.")

        except Exception as e:
            print(f"\n[WARNING] Test failed: {e}")
            print("Make sure the n8n workflow is ACTIVATED (not just saved).")
            print("The webhook only works when the workflow is active.")
    else:
        print("\nSkipped test. To use the chatbot:")
        print("  1. ACTIVATE the workflow in n8n (toggle the Active switch)")
        print("  2. Run: npm run dev")
        print("  3. Open http://localhost:5173 (or your Vite port)")

    print()
    print("=" * 60)
    print("  Setup complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()