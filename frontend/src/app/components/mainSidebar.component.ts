import { Component, input, output, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-sidebar',
  imports: [DatePipe],
  template: `
    <div class="sidebar-container">

      <!-- ── Delete Confirmation Dialog ── -->
      @if (pendingDeleteId()) {
        <div class="dialog-overlay" (click)="cancelDelete()">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <span class="dialog-title">Delete Curriculum</span>
            </div>
            <div class="dialog-body">
              <p class="dialog-desc">This action is irreversible. Type <strong>delete</strong> to confirm.</p>
              <input
                class="dialog-input"
                type="text"
                placeholder="delete"
                [value]="deleteConfirmText()"
                (input)="deleteConfirmText.set($any($event.target).value)"
                autocomplete="off"
                spellcheck="false" />
            </div>
            <div class="dialog-footer">
              <button class="dialog-btn cancel" (click)="cancelDelete()">Cancel</button>
              <button
                class="dialog-btn confirm"
                [disabled]="deleteConfirmText() !== 'delete'"
                (click)="confirmDelete()">
                Delete
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Tab Switcher -->
      <div class="tab-bar">
        <div class="tab-switcher">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'curricula'"
            (click)="activeTab.set('curricula')">
            Curricula
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'modules'"
            [disabled]="!activeCurriculum()"
            (click)="activeTab.set('modules')">
            Modules
          </button>
        </div>

        @if (activeTab() === "curricula") {
        <button class="create-btn" (click)="navigateToGenerator()">
          <span class="create-icon">+</span>
          <span class="create-label">Create Curriculum</span>
        </button>
        }
      </div>

      <!-- ── CURRICULA TAB ── -->
      @if (activeTab() === 'curricula') {
        <div class="tab-content">
          <div class="tab-header">
            <span class="tab-label">Learning Curricula</span>
            <span class="count-badge">{{ curricula().length }}</span>
          </div>

          <div class="list-scroll">
            @for (curriculum of curricula(); track curriculum._id) {
              <div
                class="list-item"
                [class.active]="activeCurriculum()?._id === curriculum._id">

                <button
                  class="list-item-btn"
                  (click)="onSelectCurriculum(curriculum._id)">
                  <div class="item-indicator">
                    <span class="item-num">{{ $index + 1 }}</span>
                  </div>
                  <div class="item-content">
                    <div class="item-title">{{ curriculum.title }}</div>
                    <div class="item-meta">
                      <span class="item-date">{{ curriculum.createdAt | date: 'MMM d' }}</span>
                    </div>
                  </div>
                </button>

                <!-- Delete trigger -->
                <button
                  class="delete-btn"
                  title="Delete curriculum"
                  (click)="openDeleteDialog(curriculum._id)">
                  ✕
                </button>

              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">◎</span>
                <span class="empty-title">No curricula yet</span>
                <span class="empty-sub">Finalize a curriculum from the generator to begin learning.</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── MODULES TAB ── -->
      @if (activeTab() === 'modules') {
        <div class="tab-content">
          <div class="tab-header">
            <span class="tab-label">{{ activeCurriculum()?.title ?? 'Modules' }}</span>
          </div>

          <div class="list-scroll">
            @if (!activeCurriculum()) {
              <div class="empty-state">
                <span class="empty-icon">▸</span>
                <span class="empty-title">No curriculum selected</span>
                <span class="empty-sub">Pick one from the Curricula tab.</span>
              </div>
            } @else {
              @for (module of activeCurriculum().modules; track $index; let mIndex = $index) {
                <div class="module-block">

                  <div class="module-header">
                    <span class="module-num">{{ mIndex + 1 }}</span>
                    <span class="module-title">{{ module.title }}</span>
                  </div>

                  @for (topic of module.topics; track $index; let tIndex = $index) {
                    <div
                      class="topic-row"
                      [class.active]="activeModuleIndex() === mIndex && activeTopicIndex() === tIndex">

                      <button
                        class="topic-item"
                        [class.done]="isTopicDone(topic)"
                        (click)="onSelectTopic(mIndex, tIndex)">
                        <span class="topic-dot">
                          @if (isTopicDone(topic)) { ✓ } @else { · }
                        </span>
                        <span class="topic-title">{{ topic.title }}</span>
                      </button>

                      @if (!topic.learningMaterial) {
                        <button
                          class="generate-btn"
                          title="Generate content for this topic"
                          (click)="onGenerateTopic(mIndex, tIndex)">
                          ⇝
                        </button>
                      }

                    </div>
                  }

                </div>
              }
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-sidebar);
      border-right: 2px solid var(--border-color);
      position: relative;
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ── Delete Confirmation Dialog ── */
    .dialog-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
    }

    .dialog {
      width: 100%;
      background-color: var(--bg-main);
      border: 2px solid var(--accent-color);
      box-shadow: 4px 4px 0 var(--accent-color);
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--accent-color);
    }
    .dialog-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--bg-main);
    }

    .dialog-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .dialog-desc {
      font-size: 0.78rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }
    .dialog-desc strong {
      color: var(--text-primary);
      font-family: 'Courier New', Courier, monospace;
    }

    .dialog-input {
      width: 100%;
      background-color: var(--bg-input);
      border: 2px solid var(--border-color);
      padding: 8px 10px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.85rem;
      color: var(--text-primary);
      box-sizing: border-box;
      transition: border-color 0.15s ease;
    }
    .dialog-input:focus {
      outline: none;
      border-color: var(--accent-color);
    }
    .dialog-input::placeholder { color: var(--text-secondary); opacity: 0.4; }

    .dialog-footer {
      display: flex;
      border-top: 1px solid var(--border-color);
    }
    .dialog-btn {
      flex: 1;
      padding: 10px;
      border: none;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .dialog-btn.cancel {
      background: transparent;
      color: var(--text-secondary);
      border-right: 1px solid var(--border-color);
    }
    .dialog-btn.cancel:hover {
      background-color: var(--bg-sidebar);
      color: var(--text-primary);
    }
    .dialog-btn.confirm {
      background-color: var(--accent-color);
      color: var(--bg-main);
    }
    .dialog-btn.confirm:hover:not(:disabled) {
      background-color: transparent;
      color: var(--accent-color);
    }
    .dialog-btn.confirm:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }

    /* ── Tab Bar ── */
    .tab-bar {
      flex-shrink: 0;
      padding: 12px 16px;
      border-bottom: 2px solid var(--border-color);
      background-color: var(--bg-sidebar);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tab-switcher {
      display: flex;
      padding: 2px;
      border: 2px solid var(--text-primary);
    }

    .tab-btn {
      flex: 1;
      padding: 8px 6px;
      background: transparent;
      border: none;
      border-right: 1px solid var(--border-color);
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .tab-btn:last-child { border-right: none; }
    .tab-btn:hover:not(:disabled):not(.active) {
      background-color: var(--bg-main);
      color: var(--text-primary);
    }
    .tab-btn.active {
      background-color: var(--accent-color);
      color: var(--bg-sidebar);
    }
    .tab-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    /* ── Ghost Create Button ── */
    .create-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 12px;
      background: transparent;
      border: 1px dashed var(--border-color);
      font-family: 'Courier New', Courier, monospace;
      cursor: pointer;
      transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .create-btn:hover { border-color: var(--accent-color); background-color: var(--bg-main); }
    .create-btn:hover .create-icon,
    .create-btn:hover .create-label { color: var(--accent-color); }
    .create-icon { font-size: 1rem; font-weight: 300; color: var(--text-secondary); line-height: 1; transition: color 0.15s ease; }
    .create-label { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--text-secondary); transition: color 0.15s ease; }

    /* ── Tab Header ── */
    .tab-header {
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .tab-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 85%;
    }
    .count-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--bg-sidebar);
      background-color: var(--accent-color);
      padding: 2px 7px;
      min-width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    /* ── Scrollable list ── */
    .list-scroll {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .list-scroll::-webkit-scrollbar { width: 4px; }
    .list-scroll::-webkit-scrollbar-thumb { background-color: var(--border-color); }

    /* ── Curriculum List Item ── */
    .list-item {
      display: flex;
      align-items: stretch;
      border-bottom: 1px solid var(--border-color);
      transition: background-color 0.15s ease;
    }
    .list-item:hover { background-color: var(--bg-main); }
    .list-item.active {
      background-color: var(--bg-main);
      border-left: 3px solid var(--accent-color);
    }
    .list-item.active .item-num {
      background-color: var(--accent-color);
      color: var(--bg-sidebar);
      border-color: var(--accent-color);
    }

    /* The clickable area inside list-item */
    .list-item-btn {
      flex: 1;
      background: transparent;
      border: none;
      padding: 14px 20px;
      text-align: left;
      cursor: pointer;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      min-width: 0;
    }
    /* Compensate left padding when active border appears */
    .list-item.active .list-item-btn { padding-left: 17px; }

    .item-indicator { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
    .item-num {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item-content { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .item-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .item-meta { display: flex; align-items: center; gap: 8px; }
    .item-date { font-size: 0.65rem; color: var(--text-secondary); }

    /* ── Delete button ── */
    .delete-btn {
      flex-shrink: 0;
      width: 32px;
      background: transparent;
      border: none;
      border-left: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.65rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease, color 0.15s ease;
      padding: 0;
      opacity: 0;
    }
    /* Only reveal on row hover */
    .list-item:hover .delete-btn { opacity: 1; }
    .delete-btn:hover {
      background-color: var(--accent-red);
      color: var(--bg-main);
      border-left-color: var(--accent-red);
    }

    /* ── Module Block ── */
    .module-block { border-bottom: 2px solid var(--border-color); }
    .module-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background-color: var(--bg-sidebar);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .module-num {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--bg-sidebar);
      background-color: var(--accent-color);
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .module-title {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-primary);
      line-height: 1.3;
    }

    /* ── Topic Row ── */
    .topic-row {
      display: flex;
      align-items: stretch;
      border-bottom: 1px solid var(--border-color);
      transition: background-color 0.15s ease;
    }
    .topic-row.active { background-color: var(--bg-main); border-left: 3px solid var(--accent-color); }
    .topic-row.active .topic-dot { color: var(--accent-color); font-weight: 900; }

    .topic-item {
      flex: 1;
      background: transparent;
      border: none;
      padding: 10px 12px 10px 29px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s ease;
      min-width: 0;
    }
    .topic-row.active .topic-item { padding-left: 26px; }
    .topic-item:hover { background-color: var(--bg-main); }
    .topic-item.done { opacity: 0.5; }

    .topic-dot {
      font-size: 0.75rem;
      color: var(--text-secondary);
      flex-shrink: 0;
      margin-top: 1px;
      font-weight: 700;
      transition: color 0.15s ease;
    }
    .topic-title { font-size: 0.8rem; color: var(--text-primary); line-height: 1.4; }

    .generate-btn {
      flex-shrink: 0;
      width: 32px;
      background: transparent;
      border: none;
      border-left: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease, color 0.15s ease;
      padding: 0;
    }
    .generate-btn:hover { background-color: var(--accent-color); color: var(--bg-sidebar); }

    /* ── Empty State ── */
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
    .empty-icon { font-size: 2rem; opacity: 0.25; }
    .empty-title { font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
    .empty-sub { font-size: 0.72rem; opacity: 0.7; line-height: 1.6; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
  `
})
export class MainSidebar {
  constructor(private router: Router) {
    effect(() => {
      if (this.activeCurriculum()) {
        this.activeTab.set('modules');
      }
    });
  }

  curricula         = input<any[]>([]);
  activeCurriculum  = input<any>(null);
  activeModuleIndex = input<number | null>(null);
  activeTopicIndex  = input<number | null>(null);

  selectCurriculum = output<string>();
  selectTopic      = output<{ moduleIndex: number; topicIndex: number }>();
  generateTopic    = output<{ moduleIndex: number; topicIndex: number }>();
  deleteCurriculum = output<string>();

  activeTab         = signal<'curricula' | 'modules'>('curricula');
  pendingDeleteId   = signal<string | null>(null);
  deleteConfirmText = signal<string>('');

  navigateToGenerator() { this.router.navigate(['/curriculumGenerator']); }
  onSelectCurriculum(id: string) { this.selectCurriculum.emit(id); }
  onSelectTopic(moduleIndex: number, topicIndex: number) { this.selectTopic.emit({ moduleIndex, topicIndex }); }
  onGenerateTopic(moduleIndex: number, topicIndex: number) { this.generateTopic.emit({ moduleIndex, topicIndex }); }

  openDeleteDialog(id: string) {
    this.pendingDeleteId.set(id);
    this.deleteConfirmText.set('');
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
    this.deleteConfirmText.set('');
  }

  confirmDelete() {
    const id = this.pendingDeleteId();
    if (!id || this.deleteConfirmText() !== 'delete') return;
    this.deleteCurriculum.emit(id);
    this.cancelDelete();
  }

  isTopicDone(topic: any): boolean {
    return topic?.assignment?.status === 'done' && topic?.research?.status === 'done';
  }
}
