import { Component, input, output } from '@angular/core';
import { parse } from 'marked';

export interface CurriculumIteration {
  iterationNumber: number;
  userPrompt: string;
  markdownResponse: string;
}

@Component({
  selector: 'app-curriculum-sidebar',
  template: `
    <div class="sidebar-container">

      <div class="sidebar-header">
        <span class="header-label">Iterations</span>
        <span class="iteration-count">{{ iterations().length }}</span>
      </div>

      <div class="iteration-list">
        @for (iter of iterations(); track iter.iterationNumber) {
          <button
            class="iteration-item"
            [class.selected]="selectedIndex() === $index"
            (click)="onSelectIteration($index)">

            <div class="iter-meta">
              <span class="iter-num">{{ iter.iterationNumber }}</span>
              @if (selectedIndex() === $index) {
                <span class="selected-badge">selected</span>
              }
            </div>

            <div class="iter-content">
              <div class="iter-prompt">{{ iter.userPrompt }}</div>
              <!-- <div class="iter-response" [innerHTML]="parseContent(iter.markdownResponse)"></div>-->
            </div>

          </button>
        } @empty {
          <div class="empty-state">
            <span class="empty-icon">◎</span>
            <span>No iterations yet.</span>
            <span class="empty-sub">Describe your topic and learning goals to begin.</span>
          </div>
        }
      </div>

      <div class="sidebar-footer">
        <div class="footer-hint">
          @if (iterations().length > 0 && selectedIndex() === null) {
            <span class="hint-text">↑ Select an iteration to finalize</span>
          }
          @if (selectedIndex() !== null) {
            <span class="hint-text selected-hint">
              ✓ Iteration {{ (selectedIndex() ?? 0) + 1 }} selected
            </span>
          }
        </div>
        <button class="clear-btn" (click)="onClearClick()">✕ Delete Iterations</button>
      </div>

    </div>
  `,
  styles: `
    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-sidebar);
    }

    .sidebar-header {
      padding: 16px 20px;
      border-bottom: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .header-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-secondary);
    }

    .iteration-count {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--bg-sidebar);
      background-color: var(--accent-color);
      padding: 2px 8px;
      min-width: 20px;
      text-align: center;
    }

    .iteration-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .iteration-list::-webkit-scrollbar { width: 4px; }
    .iteration-list::-webkit-scrollbar-thumb { background-color: var(--border-color); }

    .iteration-item {
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--border-color);
      padding: 16px 20px;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s ease;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      width: 100%;
    }

    .iteration-item:hover { background-color: var(--bg-main); }

    /* Selected: left accent bar, content doesn't shift thanks to padding compensation */
    .iteration-item.selected {
      background-color: var(--bg-main);
      border-left: 3px solid var(--accent-color);
      padding-left: 17px;
    }

    .iter-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .iter-num {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      min-width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .selected-badge {
      font-size: 0.55rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--bg-main);
      background-color: var(--accent-color);
      padding: 2px 4px;
      white-space: nowrap;
    }

    .iter-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .iter-prompt {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .iter-response {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.5;
      border-left: 3px solid var(--accent-color);
      padding-left: 10px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    :host ::ng-deep .iter-response p { margin: 0; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      color: var(--text-secondary);
      padding: 48px 20px;
      font-size: 0.85rem;
      text-align: center;
    }

    .empty-icon { font-size: 2rem; opacity: 0.3; }
    .empty-sub { font-size: 0.75rem; opacity: 0.7; line-height: 1.5; }

    .sidebar-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border-color);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Fixed height prevents footer from jumping when hint text appears */
    .footer-hint { min-height: 18px; }

    .hint-text {
      font-size: 0.68rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .selected-hint { color: var(--accent-color); font-weight: 700; }

    .clear-btn {
      width: 100%;
      background-color: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      padding: 10px;
      transition: all 0.15s ease;
    }

    .clear-btn:hover {
      background-color: var(--accent-color);
      color: var(--bg-sidebar);
      border-color: var(--accent-color);
    }
  `
})
export class CurriculumSidebar {
  iterations = input<CurriculumIteration[]>([]);
  selectedIndex = input<number | null>(null);
  selectIteration = output<number>();
  clearIterations = output<void>();

  onSelectIteration(index: number) {
    this.selectIteration.emit(index);
  }

  onClearClick() {
    this.clearIterations.emit();
  }

  parseContent(content: string): string {
    const truncated = content.length > 120 ? content.slice(0, 120) + '...' : content;
    return parse(truncated) as string;
  }
}
