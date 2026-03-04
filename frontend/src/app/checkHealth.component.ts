import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, HealthResponse } from './services/chat';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type HealthState = 'idle' | 'checking' | 'ok' | 'invalid' | 'no_key' | 'error';

@Component({
  selector: 'app-check-health',
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="bg-grid" aria-hidden="true"></div>

      <!-- Top bar -->
      <div class="top-bar">
        <span class="top-label">Project Educator</span>
        <span class="top-label">Configuration &amp; Health</span>
      </div>

      <div class="content">

        <!-- ═══════════════════════════════════════
             SECTION 1 — CONFIGURATION
        ════════════════════════════════════════ -->
        <section class="panel" style="animation-delay: 0.05s">
          <div class="panel-header">
            <span class="panel-num">01</span>
            <h2 class="panel-title">Configuration</h2>
          </div>

          <!-- API Key -->
          <div class="field-group">
            <label class="field-label">
              API Key
              <span class="field-badge" [class]="apiKeyStatus()">
                {{ apiKeyStatus() === 'set' ? '● SET' : '○ EMPTY' }}
              </span>
            </label>
            <div class="field-row">
              <input
                class="field-input"
                [type]="showKey() ? 'text' : 'password'"
                [(ngModel)]="apiKeyDraft"
                [placeholder]="apiKeyPreview() || 'Enter API key...'"
              />
              <button class="icon-btn" (click)="showKey.set(!showKey())" title="Toggle visibility">
                {{ showKey() ? '◎' : '●' }}
              </button>
            </div>
            <span class="field-hint">Stored in educator/backend/.env as API_KEY</span>
          </div>

          <!-- Model Name -->
          <div class="field-group">
            <label class="field-label">Model Name</label>
            <input
              class="field-input"
              type="text"
              [(ngModel)]="modelNameDraft"
              placeholder="e.g. gemini-1.5-pro"
            />
            <span class="field-hint">Stored as MODEL_NAME — used for all generation calls</span>
          </div>

          <!-- Save -->
          <div class="action-row">
            <button
              class="action-btn primary"
              (click)="onSave()"
              [disabled]="saveState() === 'saving'">
              {{ saveLabel() }}
            </button>
            @if (saveState() === 'saved') {
              <span class="inline-status ok">✓ Saved to .env</span>
            }
            @if (saveState() === 'error') {
              <span class="inline-status err">✕ Save failed</span>
            }
          </div>
        </section>

        <!-- ═══════════════════════════════════════
             SECTION 2 — API HEALTH CHECK
        ════════════════════════════════════════ -->
        <section class="panel" style="animation-delay: 0.15s">
          <div class="panel-header">
            <span class="panel-num">02</span>
            <h2 class="panel-title">API Health</h2>
          </div>

          <div class="health-display" [class]="healthState()">
            <span class="health-dot"></span>
            <span class="health-message">{{ healthMessage() }}</span>
          </div>

          <div class="action-row">
            <button
              class="action-btn primary"
              (click)="onCheckHealth()"
              [disabled]="healthState() === 'checking'">
              {{ healthState() === 'checking' ? 'Checking...' : 'Run Health Check' }}
            </button>
          </div>
        </section>

        <!-- ═══════════════════════════════════════
             SECTION 3 — ABOUT
        ════════════════════════════════════════ -->
        <section class="panel" style="animation-delay: 0.25s">
          <div class="panel-header">
            <span class="panel-num">03</span>
            <h2 class="panel-title">About the Project</h2>
          </div>
          <div class="about-body">
            <p class="about-text">
              <strong>Project Educator</strong> is an AI-powered self-learning system
              designed to give structure to self-directed learners. It curates
              personalised curricula, surfaces relevant resources, and reinforces
              understanding through tasks and reasoning prompts — so learners stop
              drifting and start finishing.
            </p>
            <p class="about-text">
              Built on a Node/Express backend with an Angular frontend, powered
              by the Gemini API. Streaming responses, persistent chat history,
              and a responsive UI designed to feel like a tool, not a toy.
            </p>
            <div class="tech-tags">
              <span class="tag">Angular</span>
              <span class="tag">Node.js</span>
              <span class="tag">Express</span>
              <span class="tag">Gemini API</span>
              <span class="tag">SSE Streaming</span>
              <span class="tag">marked.js</span>
              <span class="tag">KaTeX</span>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════
             SECTION 4 — AUTHOR
        ════════════════════════════════════════ -->
        <section class="panel author-panel" style="animation-delay: 0.35s">
          <div class="panel-header">
            <span class="panel-num">04</span>
            <h2 class="panel-title">Author</h2>
          </div>

          <div class="author-block">
            <div class="author-identity">
              <div class="author-name">
                <span class="name-spelled">K · S · H · R · S</span>
                <span class="name-full">Kishor</span>
              </div>
              <p class="author-bio">
                CS student. Working on ML, Math, and side projects that matter.
              </p>
            </div>

            <div class="author-links">
              <a class="link-row x-link" href="https://x.com/kshrs_atom" target="_blank" rel="noopener">
                <span class="link-icon">𝕏</span>
                <span class="link-handle">&#64;kshrs_atom</span>
                <span class="link-arrow">→</span>
              </a>
              <a class="link-row" href="https://github.com/kshrs" target="_blank" rel="noopener">
                <span class="link-icon">⌥</span>
                <span class="link-handle">github.com/kshrs</span>
                <span class="link-arrow">→</span>
              </a>
              <a class="link-row" href="https://www.linkedin.com/in/kishor-s-21813132a/" target="_blank" rel="noopener">
                <span class="link-icon">in</span>
                <span class="link-handle">kishor-s</span>
                <span class="link-arrow">→</span>
              </a>
              <a class="link-row" href="mailto:kishorjsk2006@gmail.com">
                <span class="link-icon">@</span>
                <span class="link-handle">kishorjsk2006@gmail.com</span>
                <span class="link-arrow">→</span>
              </a>
            </div>
          </div>
        </section>

      </div>

      <div class="bottom-bar">
        <span class="bottom-label">Project Educator — built by k·s·h·r·s</span>
      </div>
    </div>
  `,
  styles: `
    /* --- Page Shell --- */
    .page {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      background-color: var(--bg-main);
      overflow: hidden;
      box-sizing: border-box;
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(var(--border-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
      background-size: 48px 48px;
      opacity: 0.3;
      pointer-events: none;
    }

    /* --- Top / Bottom Bars --- */
    .top-bar, .bottom-bar {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 40px;
      flex-shrink: 0;
    }

    .top-bar { border-bottom: 2px solid var(--accent-color); }
    .bottom-bar { border-top: 2px solid var(--accent-color); }

    .top-label, .bottom-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--text-secondary);
    }

    /* --- Scrollable Content Area --- */
    .content {
      position: relative;
      z-index: 1;
      flex: 1;
      overflow-y: auto;
      padding: 32px 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-height: 0;
    }

    .content::-webkit-scrollbar { width: 4px; }
    .content::-webkit-scrollbar-thumb { background-color: var(--border-color); }

    /* --- Panels --- */
    .panel {
      background-color: var(--bg-input);
      border: 2px solid var(--border-color);
      border-left: 4px solid var(--accent-color);
      padding: 28px 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fade-up 0.4s ease both;
    }

    .panel-header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 14px;
    }

    .panel-num {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--accent-red);
    }

    .panel-title {
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-primary);
      margin: 0;
    }

    /* --- Form Fields --- */
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .field-badge {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 2px 8px;
      border: 1px solid;
    }

    .field-badge.set {
      color: #16a34a;
      border-color: #16a34a;
      background-color: rgba(22, 163, 74, 0.08);
    }

    .field-badge.empty {
      color: var(--accent-red);
      border-color: var(--accent-red);
      background-color: rgba(242, 97, 63, 0.08);
    }

    .field-row {
      display: flex;
      gap: 8px;
    }

    .field-input {
      flex: 1;
      background-color: var(--bg-sidebar);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
      padding: 10px 14px;
      font-size: 0.9rem;
      font-family: 'Courier New', Courier, monospace;
      transition: border-color 0.15s ease;
      box-sizing: border-box;
    }

    .field-input:focus {
      outline: none;
      border-color: var(--accent-color);
    }

    .field-input::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
    }

    .field-hint {
      font-size: 0.7rem;
      color: var(--text-secondary);
      letter-spacing: 0.3px;
    }

    .icon-btn {
      background: transparent;
      border: 2px solid var(--border-color);
      color: var(--text-secondary);
      width: 40px;
      font-size: 0.85rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.15s ease, color 0.15s ease;
    }

    .icon-btn:hover {
      border-color: var(--accent-color);
      color: var(--text-primary);
    }

    /* --- Actions --- */
    .action-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .action-btn {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 10px 24px;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
      border: 2px solid var(--accent-color);
    }

    .action-btn.primary {
      background-color: var(--accent-color);
      color: var(--bg-main);
    }

    .action-btn.primary:hover:not(:disabled) {
      background-color: var(--bg-main);
      color: var(--accent-color);
    }

    .action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .inline-status {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .inline-status.ok  { color: #16a34a; }
    .inline-status.err { color: var(--accent-red); }

    /* --- Health Display --- */
    .health-display {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border: 2px solid var(--border-color);
      background-color: var(--bg-sidebar);
    }

    .health-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      background-color: var(--border-color);
    }

    /* Health dot colors driven by parent class */
    .health-display.ok     .health-dot { background-color: #16a34a; }
    .health-display.invalid .health-dot { background-color: var(--accent-red); }
    .health-display.no_key .health-dot { background-color: #ca8a04; }
    .health-display.error  .health-dot { background-color: var(--accent-red); }
    .health-display.checking .health-dot {
      background-color: #3b82f6;
      animation: pulse 1s ease infinite;
    }

    .health-message {
      font-size: 0.85rem;
      color: var(--text-primary);
      font-family: 'Courier New', Courier, monospace;
    }

    /* --- About Section --- */
    .about-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .about-text {
      font-size: 0.9rem;
      line-height: 1.75;
      color: var(--text-secondary);
      margin: 0;
    }

    .about-text strong {
      color: var(--text-primary);
      font-weight: 700;
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 10px;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    /* --- Author Panel --- */
    .author-block {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .author-identity {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .author-name {
      display: flex;
      align-items: baseline;
      gap: 16px;
    }

    /* The spelled-out k·s·h·r·s — monospaced, spaced out, treated as a logotype */
    .name-spelled {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 4px;
      color: var(--accent-red);
      font-family: 'Courier New', Courier, monospace;
    }

    .name-full {
      font-size: 1.5rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: var(--text-primary);
    }

    .author-bio {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    /* --- Social Links --- */
    .author-links {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .link-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-color);
      text-decoration: none;
      transition: background-color 0.15s ease, padding-left 0.15s ease;
      cursor: pointer;
    }

    .link-row:first-child { border-top: 1px solid var(--border-color); }

    .link-row:hover {
      background-color: var(--bg-sidebar);
      padding-left: 8px;
    }

    /* X gets special treatment — it's first and most important */
    .x-link .link-icon {
      font-weight: 900;
      color: var(--text-primary);
    }

    .x-link:hover {
      background-color: var(--accent-color);
    }

    .x-link:hover .link-icon,
    .x-link:hover .link-handle,
    .x-link:hover .link-arrow {
      color: var(--bg-main);
    }

    .link-icon {
      font-size: 0.85rem;
      font-weight: 700;
      width: 24px;
      text-align: center;
      color: var(--text-secondary);
      flex-shrink: 0;
      font-family: 'Courier New', Courier, monospace;
    }

    .link-handle {
      flex: 1;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      font-family: 'Courier New', Courier, monospace;
    }

    .link-arrow {
      font-size: 0.9rem;
      color: var(--text-secondary);
      transition: transform 0.15s ease;
    }

    .link-row:hover .link-arrow {
      transform: translateX(4px);
    }

    /* --- Animations --- */
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
  `
})
export class CheckHealth implements OnInit {
  private configService = inject(ChatService);

  // State
  apiKeyStatus = signal<'set' | 'empty'>('empty');
  apiKeyPreview = signal('');
  modelNameDraft = '';
  apiKeyDraft = '';
  showKey = signal(false);
  saveState = signal<SaveState>('idle');
  healthState = signal<HealthState>('idle');
  healthMessage = signal('Press "Run Health Check" to test your API key.');

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.configService.getConfig().subscribe({
      next: (res) => {
        this.apiKeyStatus.set(res.apiKeyStatus);
        this.apiKeyPreview.set(res.apiKeyPreview);
        this.modelNameDraft = res.modelName;
      },
      error: () => {
        this.apiKeyStatus.set('empty');
      }
    });
  }

  saveLabel() {
    switch (this.saveState()) {
      case 'saving': return 'Saving...';
      case 'saved':  return 'Saved ✓';
      case 'error':  return 'Retry Save';
      default:       return 'Save to .env';
    }
  }

  onSave() {
    this.saveState.set('saving');
    const payload: { apiKey?: string; modelName?: string } = {};

    // Only send apiKey if the user typed something new
    if (this.apiKeyDraft.trim()) payload.apiKey = this.apiKeyDraft.trim();
    payload.modelName = this.modelNameDraft.trim();

    this.configService.saveConfig(payload).subscribe({
      next: () => {
        this.saveState.set('saved');
        this.apiKeyDraft = '';
        this.loadConfig(); // Refresh preview
        setTimeout(() => this.saveState.set('idle'), 3000);
      },
      error: () => {
        this.saveState.set('error');
        setTimeout(() => this.saveState.set('idle'), 4000);
      }
    });
  }

  onCheckHealth() {
    this.healthState.set('checking');
    this.healthMessage.set('Pinging API...');

    this.configService.checkHealth().subscribe({
      next: (res: HealthResponse) => {
        this.healthState.set(res.status);
        this.healthMessage.set(res.message);
      },
      error: () => {
        this.healthState.set('error');
        this.healthMessage.set('Could not reach the backend.');
      }
    });
  }
}
