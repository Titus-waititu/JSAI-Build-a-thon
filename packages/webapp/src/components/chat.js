import { LitElement, html } from "lit";
import {
  loadMessages,
  saveMessages,
  clearMessages,
} from "../utils/chatStore.js";
import "./chat.css";

export class ChatInterface extends LitElement {
  static get properties() {
    return {
      messages: { type: Array },
      inputMessage: { type: String },
      isLoading: { type: Boolean },
      isRetrieving: { type: Boolean },
      ragEnabled: { type: Boolean },
      chatMode: { type: String },
    };
  }

  constructor() {
    super();
    this.messages = [];
    this.inputMessage = "";
    this.isLoading = false;
    this.isRetrieving = false;
    this.ragEnabled = true;
    this.chatMode = "basic";
  }

  createRenderRoot() {
    return this; // Light DOM to allow external CSS
  }

  connectedCallback() {
    super.connectedCallback();
    this.messages = loadMessages();
  }

  updated(changedProps) {
    if (changedProps.has("messages")) {
      saveMessages(this.messages);
    }
  }

  render() {
    return html`
      <div class="chat-container">
        <div class="chat-header">
          <button class="clear-cache-btn" @click=${this._clearCache}>
            🧹 Clear Chat
          </button>

          <div class="mode-selector">
            <label>Mode:</label>
            <select @change=${this._handleModeChange}>
              <option value="basic" ?selected=${this.chatMode === "basic"}>
                Basic AI
              </option>
              <option value="agent" ?selected=${this.chatMode === "agent"}>
                Agent
              </option>
            </select>
          </div>

          <label
            class="rag-toggle ${this.chatMode === "agent" ? "disabled" : ""}"
          >
            <input
              type="checkbox"
              ?checked=${this.ragEnabled}
              @change=${this._toggleRag}
              ?disabled=${this.chatMode === "agent"}
            />
            Use Employee Handbook
          </label>
        </div>

        <div class="chat-messages">
          ${this.messages.map(
            (message) => html`
              <div
                class="message ${message.role === "user"
                  ? "user-message"
                  : "ai-message"}"
              >
                <div class="message-content">
                  <span class="message-sender">
                    ${message.role === "user"
                      ? "You"
                      : this.chatMode === "agent"
                      ? "Agent"
                      : "AI"}
                  </span>
                  <p>${message.content}</p>
                  ${this.ragEnabled &&
                  message.sources &&
                  message.sources.length > 0
                    ? html`
                        <details class="sources">
                          <summary>📚 Sources</summary>
                          <div class="sources-content">
                            ${message.sources.map(
                              (source) => html`<p>${source}</p>`
                            )}
                          </div>
                        </details>
                      `
                    : ""}
                </div>
              </div>
            `
          )}
          ${this.isRetrieving
            ? html`
                <div class="message system-message">
                  <p>📚 Searching employee handbook...</p>
                </div>
              `
            : ""}
          ${this.isLoading && !this.isRetrieving
            ? html`
                <div class="message ai-message">
                  <div class="message-content">
                    <span class="message-sender">AI</span>
                    <p>Thinking...</p>
                  </div>
                </div>
              `
            : ""}
        </div>

        <div class="chat-input">
          <input
            type="text"
            placeholder=${this.chatMode === "basic"
              ? "Ask about company policies, benefits, etc..."
              : "Ask Agent"}
            .value=${this.inputMessage}
            @input=${this._handleInput}
            @keyup=${this._handleKeyUp}
          />
          <button
            @click=${this._sendMessage}
            ?disabled=${this.isLoading || !this.inputMessage.trim()}
          >
            Send
          </button>
        </div>
      </div>
    `;
  }

  _toggleRag(e) {
    this.ragEnabled = e.target.checked;
  }

  _clearCache() {
    clearMessages();
    this.messages = [];
  }

  _handleInput(e) {
    this.inputMessage = e.target.value;
  }

  _handleKeyUp(e) {
    if (e.key === "Enter" && this.inputMessage.trim() && !this.isLoading) {
      this._sendMessage();
    }
  }

  async _sendMessage() {
    if (!this.inputMessage.trim() || this.isLoading) return;

    const userMessage = {
      role: "user",
      content: this.inputMessage,
    };

    this.messages = [...this.messages, userMessage];
    const userQuery = this.inputMessage;
    this.inputMessage = "";
    this.isLoading = true;

    try {
      const aiResponse = await this._apiCall(userQuery);
      this.messages = [
        ...this.messages,
        {
          role: "assistant",
          content: aiResponse.reply || aiResponse,
          sources: aiResponse.sources || [],
        },
      ];
    } catch (error) {
      console.error("Error calling model:", error);
      this.messages = [
        ...this.messages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ];
    } finally {
      this.isLoading = false;
    }
  }

  async _apiCall(message) {
    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        useRAG: this.ragEnabled,
        mode: this.chatMode,
      }),
    });

    const data = await res.json();
    return data;
  }

  _handleModeChange(e) {
    const newMode = e.target.value;
    if (newMode !== this.chatMode) {
      this.chatMode = newMode;
      if (newMode === "agent") {
        this.ragEnabled = false;
      }
      clearMessages();
      this.messages = [];
    }
  }
}

customElements.define("chat-interface", ChatInterface);
