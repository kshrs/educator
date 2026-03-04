import { Component, input, output, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked, parse } from 'marked';
import markedKatex from 'marked-katex-extension';
import { CurriculumIteration } from './curriculumSidebar.component';

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));

@Component({
  selector: 'app-curriculum-chat',
  template: `
    <div class="chat-wrapper">

      <!-- Past iterations rendered as a stack above the live response -->
      @for (iter of iterations(); track iter.iterationNumber) {
        @if ($index < iterations().length - 1 || llmResponse().length === 0) {
          <div class="iteration-block"
               [id]="'iteration-'+$index"
               [class.is-selected]="selectedIndex() === $index"
               (click)="onSelectIteration($index)">

            <div class="block-meta">
              <span class="block-num">{{ iter.iterationNumber }}</span>
              <span class="block-label">Iteration</span>
              @if (selectedIndex() === $index) {
                <span class="block-selected-tag">● selected</span>
              }
              <span class="block-select-hint">click to select</span>
            </div>

            <div class="block-prompt">
              <span class="field-eyebrow">Prompt</span>
              <span class="prompt-text">{{ iter.userPrompt }}</span>
            </div>

            <div class="block-divider"></div>

            <div class="block-response">
              <span class="field-eyebrow">Response</span>
              <div class="markdown-content"
                   [innerHTML]="parseIteration(iter.markdownResponse)">
              </div>
            </div>

          </div>
        }
      }

      <!-- Live streaming block — only shown while a response is being generated -->
      @if (submittedPrompt().length > 0) {
        <div class="iteration-block live-block">

          <div class="block-meta">
            <span class="block-num">{{ iterations().length + (llmResponse().length > 0 ? 0 : 1) }}</span>
            <span class="block-label">Current</span>
            @if (llmResponse().length > 0 && llmResponse() !== 'stream closed') {
              <span class="streaming-tag">● streaming</span>
            }
          </div>

          <div class="block-prompt">
            <span class="field-eyebrow">Prompt</span>
            <span class="prompt-text">{{ submittedPrompt() }}</span>
          </div>

          <div class="block-divider"></div>

          <div class="block-response">
            <span class="field-eyebrow">Response</span>
            @if (llmResponse().length === 0) {
              <div class="placeholder">
                <span class="placeholder-icon">▸</span>
                <span>Generating curriculum...</span>
              </div>
            } @else {
              <div class="markdown-content" [innerHTML]="parsedLiveContent()"></div>
            }
          </div>

        </div>
      }

      <!-- Initial empty state — no prompt yet -->
      @if (submittedPrompt().length === 0 && iterations().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">◎</div>
          <div class="empty-title">No curriculum yet</div>
          <div class="empty-sub">
            Describe your topic, learning objectives, and current skill level below.
          </div>
        </div>
      }

    </div>
  `,
  styles: `
    /* --- Wrapper --- */
    .chat-wrapper {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* --- Iteration Block --- */
    .iteration-block {
      background-color: var(--bg-input);
      border: 2px solid var(--border-color);
      box-shadow: 4px 4px 0px var(--border-color);
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .iteration-block:hover {
      border-color: var(--accent-color);
      box-shadow: 4px 4px 0px var(--accent-color);
    }

    /* Selected block — full accent treatment */
    .iteration-block.is-selected {
      border-color: var(--accent-color);
      border-left: 4px solid var(--accent-color);
      box-shadow: 5px 5px 0px var(--accent-color);
    }

    /* Live block never has selection interaction */
    .live-block {
      border-color: var(--accent-color);
      box-shadow: 5px 5px 0px var(--accent-color);
      cursor: default;
    }

    .live-block:hover {
      border-color: var(--accent-color);
      box-shadow: 5px 5px 0px var(--accent-color);
    }

    /* --- Block Meta Bar --- */
    .block-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-sidebar);
    }

    .block-num {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--bg-sidebar);
      background-color: var(--accent-color);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .block-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-secondary);
      flex: 1;
    }

    .block-selected-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent-color);
    }

    .block-select-hint {
      font-size: 0.6rem;
      color: var(--text-secondary);
      opacity: 0;
      transition: opacity 0.15s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .iteration-block:hover .block-select-hint { opacity: 1; }
    .iteration-block.is-selected .block-select-hint { opacity: 0; }
    .live-block .block-select-hint { display: none; }

    .streaming-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent-red);
      animation: pulse 1.2s ease infinite;
    }

    /* --- Sections inside block --- */
    .block-prompt,
    .block-response {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .block-divider {
      border-bottom: 1px solid var(--border-color);
      margin: 0 24px;
    }

    .field-eyebrow {
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--text-secondary);
    }

    .prompt-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.6;
    }

    /* --- Placeholder --- */
    .placeholder {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-secondary);
      font-size: 0.95rem;
      font-style: italic;
      padding: 8px 0;
    }

    .placeholder-icon { font-size: 1.2rem; opacity: 0.4; }

    /* --- Empty State --- */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 80px 40px;
      text-align: center;
    }

    .empty-icon { font-size: 3rem; opacity: 0.15; }

    .empty-title {
      font-size: 1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-secondary);
    }

    .empty-sub {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.7;
      max-width: 360px;
      opacity: 0.7;
    }

    /* --- Markdown --- */
    .markdown-content {
      font-size: 1rem;
      line-height: 1.7;
      color: var(--text-primary);
      width: 100%;
    }

    :host ::ng-deep .markdown-content p { margin: 0 0 1.1rem 0; }

    :host ::ng-deep .markdown-content h1,
    :host ::ng-deep .markdown-content h2,
    :host ::ng-deep .markdown-content h3 {
      color: var(--accent-color);
      margin: 2rem 0 0.75rem;
      font-weight: 700;
    }

    :host ::ng-deep .markdown-content h1 { font-size: 1.4rem; }
    :host ::ng-deep .markdown-content h2 { font-size: 1.2rem; }
    :host ::ng-deep .markdown-content h3 { font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; }

    :host ::ng-deep .markdown-content ul,
    :host ::ng-deep .markdown-content ol { margin: 0 0 1.1rem 0; padding-left: 1.5rem; }
    :host ::ng-deep .markdown-content li { margin-bottom: 0.4rem; }

    :host ::ng-deep .markdown-content blockquote {
      margin: 1.5rem 0;
      padding: 1rem 1.5rem;
      border-left: 4px solid var(--accent-color);
      color: var(--text-secondary);
      background-color: var(--bg-sidebar);
      font-style: italic;
    }

    :host ::ng-deep .markdown-content code {
      background-color: var(--bg-sidebar);
      color: var(--accent-color);
      padding: 0.15em 0.4em;
      border: 1px solid var(--border-color);
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.88em;
    }

    :host ::ng-deep .markdown-content pre {
      background-color: var(--bg-sidebar);
      padding: 16px 20px;
      border: 2px solid var(--border-color);
      border-left: 4px solid var(--accent-color);
      overflow-x: auto;
      margin-bottom: 1.5rem;
      box-shadow: 4px 4px 0px var(--border-color);
    }

    :host ::ng-deep .markdown-content pre code {
      background-color: transparent;
      color: var(--text-primary);
      padding: 0;
      border: none;
      font-size: 0.88em;
    }

    :host ::ng-deep .katex-display {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 8px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `
})
export class CurriculumChat {
  submittedPrompt = input<string>('');
  llmResponse = input<string>('');
  iterations = input<CurriculumIteration[]>([]);
  selectedIndex = input<number | null>(null);

  selectIteration = output<number>();

  private sanitizer = inject(DomSanitizer);

  parsedLiveContent = computed(() => {
    const rawHTML = parse(this.llmResponse()) as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHTML);
  });

  parseIteration(markdown: string) {
    const rawHTML = parse(markdown) as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHTML);
  }

  onSelectIteration(index: number) {
    this.selectIteration.emit(index);
  }
}
