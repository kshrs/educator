import { Component, signal, output, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-input',
  template: `
    <div class="input-wrapper" [class.has-text]="currentText()">
      <textarea
        #entry
        [value]="currentText()"
        (input)="onInput(entry)"
        (keydown.enter)="$event.preventDefault(); onSubmit(entry)"
        placeholder="Describe your learning goals..."
      ></textarea>
      <div class="input-footer">
        <span class="char-hint" [class.visible]="currentText().length > 0">
          ↵ enter to send
        </span>
        <button
          class="generate-btn"
          [disabled]="!currentText().trim()"
          (click)="onSubmit(entry)">
          Generate ↗
        </button>
      </div>
    </div>
  `,
  styles: `
    /* --- HOST --- */
    :host {
      display: block;
      width: 100%;
      max-width: 800px;
    }

    /* --- WRAPPER --- */
    .input-wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: var(--bg-input);
      border: 2px solid var(--border-color);
      padding: 16px 20px 12px;
      gap: 10px;
      box-shadow: 4px 4px 0px var(--border-color);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }

    .input-wrapper.has-text {
      border-color: var(--accent-color);
      box-shadow: 4px 4px 0px var(--accent-color);
    }

    /* --- TEXTAREA --- */
    textarea {
      width: 100%;
      min-height: 52px;
      max-height: 8rem;
      overflow-y: auto;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 1rem;
      line-height: 1.6;
      font-family: inherit;
      resize: none;
      padding: 0;
      box-sizing: border-box;
    }

    textarea:focus {
      outline: none;
    }

    textarea::placeholder {
      color: var(--text-secondary);
      font-style: italic;
    }

    textarea::-webkit-scrollbar { width: 4px; }
    textarea::-webkit-scrollbar-thumb {
      background-color: var(--border-color);
      border-radius: 2px;
    }

    /* --- FOOTER ROW --- */
    .input-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .char-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
      letter-spacing: 0.5px;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .char-hint.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* --- GENERATE BUTTON --- */
    .generate-btn {
      background-color: var(--accent-color);
      color: var(--bg-input);
      border: 2px solid var(--accent-color);
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      cursor: pointer;
      padding: 8px 20px;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .generate-btn:hover:not(:disabled) {
      background-color: var(--bg-input);
      color: var(--accent-color);
    }

    .generate-btn:disabled {
      background-color: transparent;
      border-color: var(--border-color);
      color: var(--text-secondary);
      cursor: not-allowed;
    }
  `
})
export class Input {
  currentText = signal('');
  submitPrompt = output<string>();

  onInput(el: HTMLTextAreaElement) {
    this.currentText.set(el.value);
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  onSubmit(el: HTMLTextAreaElement) {
    if (!this.currentText().trim()) return;
    this.submitPrompt.emit(this.currentText());
    this.currentText.set('');
    // Reset textarea height after clearing
    el.style.height = 'auto';
  }
}
