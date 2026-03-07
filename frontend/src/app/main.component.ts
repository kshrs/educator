import { Component, signal, OnInit } from '@angular/core';
import { MainSidebar } from './components/mainSidebar.component';
import { ChatService } from './services/chat';
import { marked } from 'marked';

@Component({
  selector: 'app-main',
  imports: [MainSidebar],
  template: `
    <div class="layout-wrapper">

      <!-- Left sidebar -->
      <aside class="sidebar">
        <app-main-sidebar
          [curricula]="curricula()"
          [activeCurriculum]="activeCurriculum()"
          (selectCurriculum)="handleSelectCurriculum($event)"
          (selectTopic)="handleSelectTopic($event)"
          (generateTopic)="handleGenerateTopic($event)"
          (deleteCurriculum)="handleDeleteCurriculum($event)">
        </app-main-sidebar>
      </aside>

      <!-- Main content -->
      <main class="main-content">

        <!-- State 1: No curriculum selected -->
        @if (!activeCurriculum()) {
          <div class="empty-main">
            <div class="empty-icon">◎</div>
            <div class="empty-title">Select a curriculum</div>
            <div class="empty-sub">Pick a curriculum from the sidebar or create one to begin learning.</div>
            @if (curricula().length === 0) {
              <div class="empty-hint">
                No learning curricula found. Go to the
                <a href="/curriculumGenerator">Curriculum Generator</a>
                to create and finalize one first.
              </div>
            }
          </div>
        }

        <!-- State 2: Curriculum selected, no topic picked -->
        @if (activeCurriculum() && activeTopicIndex() === null) {
          <div class="empty-main">
            <div class="empty-icon">▸</div>
            <div class="empty-title">{{ activeCurriculum().title }}</div>
            <div class="empty-sub">Select a topic from the modules panel to start learning.</div>
          </div>
        }

        <!-- State 3: Active topic -->
        @if (activeCurriculum() && activeTopicIndex() !== null && activeTopic()) {
          <div class="topic-view">

            <!-- Topic header -->
            <div class="topic-header">
              <div class="topic-breadcrumb">
                <span>{{ activeCurriculum().title }}</span>
                <span class="breadcrumb-sep">›</span>
                <span>Module {{ (activeModuleIndex() ?? 0) + 1 }}</span>
                <span class="breadcrumb-sep">›</span>
                <span>Topic {{ (activeTopicIndex() ?? 0) + 1 }}</span>
              </div>
              <h1 class="topic-title">{{ activeTopic()!.title }}</h1>
              <div class="topic-status-row">
                <span class="status-chip" [class.done]="activeTopic()!.assignment?.status === 'done'">
                  Assignment: {{ activeTopic()!.assignment?.status ?? 'pending' }}
                </span>
                <span class="status-chip" [class.done]="activeTopic()!.research?.status === 'done'">
                  Research: {{ activeTopic()!.research?.status ?? 'pending' }}
                </span>
              </div>
            </div>

            <!-- Learning material -->
            <section class="content-section">
              <div class="section-label">Learning Material</div>

              @if (isGeneratingTopic()) {
                <!-- Generating state -->
                <div class="generating-state">
                  <span class="generating-dot"></span>
                  <span>Generating content for this topic...</span>
                </div>
              } @else if (activeTopic()!.learningMaterial) {
                <div class="markdown-body"
                  [innerHTML]="parseMarkdown(activeTopic()!.learningMaterial)">
                </div>
              } @else {
                <!-- No content yet — prompt to generate -->
                <div class="no-content-state">
                  <span class="empty-icon">◎</span>
                  <span class="no-content-title">No content generated yet</span>
                  <span class="no-content-sub">Click ⇝ next to this topic in the sidebar to generate learning material.</span>
                </div>
              }
            </section>

            <!-- Resources — only show when content exists -->
            @if (!isGeneratingTopic() && activeTopic()!.learningResources?.length > 0) {
              <section class="content-section">
                <div class="section-label">Resources</div>
                <div class="resource-list">
                  @for (resource of activeTopic()!.learningResources; track resource.url) {
                    <a class="resource-item" [href]="resource.url" target="_blank" rel="noopener">
                      <span class="resource-arrow">↗</span>
                      <span class="resource-title">{{ resource.title }}</span>
                    </a>
                  }
                </div>
              </section>
            }

            <!-- Assignment — only show when content exists -->
            @if (!isGeneratingTopic() && activeTopic()!.learningMaterial) {
              <section class="content-section task-section">
                <div class="section-label">
                  Assignment
                  <span class="task-status-badge"
                    [class.done]="activeTopic()!.assignment?.status === 'done'">
                    {{ activeTopic()!.assignment?.status ?? 'pending' }}
                  </span>
                </div>

                @if (activeTopic()!.assignment?.description) {
                  <div class="task-description markdown-body"
                    [innerHTML]="parseMarkdown(activeTopic()!.assignment.description)">
                  </div>
                }

                @if (activeTopic()!.assignment?.review) {
                  <div class="task-review">
                    <div class="review-label">AI Review</div>
                    <div class="markdown-body"
                      [innerHTML]="parseMarkdown(activeTopic()!.assignment.review)">
                    </div>
                  </div>
                }
                @if (activeTopic()!.assignment?.status === 'done') {
                  <!-- Submitted view -->
                  <div class="submission-submitted">
                    <div class="submission-submitted-header">
                      <span class="submitted-label">Your Submission</span>
                      <button class="expand-btn" (click)="assignmentExpanded.set(!assignmentExpanded())">
                        {{ assignmentExpanded() ? '▲ collapse' : '▼ expand' }}
                      </button>
                    </div>
                    @if (assignmentExpanded()) {
                      <div class="submission-text">{{ activeTopic()!.assignment.submission }}</div>
                    }
                  </div>
                } @else {
                  <!-- Input view — existing textarea + submit button unchanged -->
                  <div class="submission-area">
                    <textarea
                      class="submission-input"
                      placeholder="Write your assignment response here..."
                      [value]="assignmentDraft()"
                      (input)="assignmentDraft.set($any($event.target).value)"
                      rows="6">
                    </textarea>
                    <button
                      class="submit-btn"
                      [disabled]="!assignmentDraft().trim() || isSubmitting()"
                      (click)="submitAssignment()">
                      {{ isSubmitting() ? 'Evaluating...' : 'Submit Assignment' }}
                    </button>
                  </div>
                }
              </section>

              <!-- Research -->
              <section class="content-section task-section">
                <div class="section-label">
                  Research Task
                  <span class="task-status-badge"
                    [class.done]="activeTopic()!.research?.status === 'done'">
                    {{ activeTopic()!.research?.status ?? 'pending' }}
                  </span>
                </div>

                @if (activeTopic()!.research?.description) {
                  <div class="task-description markdown-body"
                    [innerHTML]="parseMarkdown(activeTopic()!.research.description)">
                  </div>
                }

                @if (activeTopic()!.research?.review) {
                  <div class="task-review">
                    <div class="review-label">AI Review</div>
                    <div class="markdown-body"
                      [innerHTML]="parseMarkdown(activeTopic()!.research.review)">
                    </div>
                  </div>
                }

                <div class="submission-area">
                  <textarea
                    class="submission-input"
                    placeholder="Write your research findings here..."
                    [value]="researchDraft()"
                    (input)="researchDraft.set($any($event.target).value)"
                    rows="6">
                  </textarea>
                  <button
                    class="submit-btn"
                    [disabled]="!researchDraft().trim() || isSubmitting()"
                    (click)="submitResearch()">
                    {{ isSubmitting() ? 'Evaluating...' : 'Submit Research' }}
                  </button>
                </div>
              </section>
            }

          </div>
        }

      </main>
    </div>
  `,
  styles: `
    .layout-wrapper {
      display: flex;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-main);
      color: var(--text-primary);
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      height: 100%;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      border-left: 2px solid var(--border-color);
    }

    /* ── Empty states ── */
    .empty-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 60px 40px;
      text-align: center;
    }
    .empty-icon { font-size: 3rem; opacity: 0.12; }
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
      max-width: 340px;
      opacity: 0.7;
    }
    .empty-hint {
      font-size: 0.8rem;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      padding: 10px 16px;
      line-height: 1.6;
      max-width: 340px;
    }
    .empty-hint a {
      color: var(--accent-color);
      font-weight: 700;
      text-decoration: none;
      border-bottom: 1px solid var(--accent-color);
    }

    /* ── Topic view ── */
    .topic-view {
      display: flex;
      flex-direction: column;
      max-width: 860px;
      width: 100%;
      margin: 0 auto;
      padding: 0 40px 80px;
    }

    /* ── Topic header ── */
    .topic-header {
      padding: 40px 0 32px;
      border-bottom: 2px solid var(--border-color);
    }
    .topic-breadcrumb {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .breadcrumb-sep { opacity: 0.4; }
    .topic-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
      margin: 0 0 20px;
      font-family: 'Courier New', Courier, monospace;
    }
    .topic-status-row { display: flex; gap: 10px; }
    .status-chip {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border: 1px solid var(--border-color);
      padding: 3px 8px;
      color: var(--text-secondary);
    }
    .status-chip.done {
      background-color: var(--accent-color);
      color: var(--bg-main);
      border-color: var(--accent-color);
    }

    /* ── Content sections ── */
    .content-section {
      padding: 36px 0;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
    }
    .section-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--text-secondary);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* ── Generating state ── */
    .generating-state {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      padding: 24px 0;
    }
    .generating-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--accent-red);
      animation: pulse 1.2s ease infinite;
      flex-shrink: 0;
    }

    /* ── No content state ── */
    .no-content-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 40px 20px;
      text-align: center;
    }
    .no-content-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary);
    }
    .no-content-sub {
      font-size: 0.75rem;
      color: var(--text-secondary);
      opacity: 0.7;
      line-height: 1.6;
      max-width: 300px;
    }

    /* ── Markdown body ── */
    .markdown-body {
      font-size: 0.95rem;
      line-height: 1.8;
      color: var(--text-primary);
    }
    :host ::ng-deep .markdown-body h1,
    :host ::ng-deep .markdown-body h2,
    :host ::ng-deep .markdown-body h3 {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      margin: 28px 0 12px;
      line-height: 1.3;
    }
    :host ::ng-deep .markdown-body h1 { font-size: 1.4rem; }
    :host ::ng-deep .markdown-body h2 { font-size: 1.15rem; }
    :host ::ng-deep .markdown-body h3 { font-size: 1rem; }
    :host ::ng-deep .markdown-body p { margin: 0 0 16px; }
    :host ::ng-deep .markdown-body ul,
    :host ::ng-deep .markdown-body ol { padding-left: 24px; margin: 0 0 16px; }
    :host ::ng-deep .markdown-body li { margin-bottom: 6px; }
    :host ::ng-deep .markdown-body code {
      background-color: var(--bg-sidebar);
      border: 1px solid var(--border-color);
      padding: 1px 5px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.85em;
    }
    :host ::ng-deep .markdown-body pre {
      background-color: var(--bg-sidebar);
      border: 2px solid var(--border-color);
      border-left: 4px solid var(--accent-color);
      padding: 16px 20px;
      overflow-x: auto;
      margin: 0 0 20px;
    }
    :host ::ng-deep .markdown-body pre code { background: none; border: none; padding: 0; font-size: 0.85rem; }
    :host ::ng-deep .markdown-body blockquote {
      border-left: 4px solid var(--accent-color);
      padding-left: 16px;
      margin: 0 0 16px;
      color: var(--text-secondary);
    }
    :host ::ng-deep .markdown-body strong { font-weight: 700; }
    :host ::ng-deep .markdown-body a {
      color: var(--accent-color);
      text-decoration: none;
      border-bottom: 1px solid var(--accent-color);
    }

    /* ── Resources ── */
    .resource-list { display: flex; flex-direction: column; gap: 8px; }
    .resource-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      text-decoration: none;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 600;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .resource-item:hover { background-color: var(--bg-sidebar); border-color: var(--accent-color); }
    .resource-arrow { color: var(--accent-color); font-size: 1rem; flex-shrink: 0; }

    /* ── Task sections ── */
    .task-status-badge {
      font-size: 0.55rem;
      padding: 2px 6px;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .task-status-badge.done {
      background-color: var(--accent-color);
      color: var(--bg-main);
      border-color: var(--accent-color);
    }
    .task-description { margin-bottom: 24px; }
    .task-review {
      background-color: var(--bg-sidebar);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-color);
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .review-label {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--accent-color);
      margin-bottom: 12px;
    }

    /* ── Submission ── */
    .submission-area { display: flex; flex-direction: column; gap: 10px; }
    .submission-input {
      width: 100%;
      background-color: var(--bg-input);
      border: 2px solid var(--border-color);
      padding: 14px 16px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.85rem;
      color: var(--text-primary);
      resize: vertical;
      transition: border-color 0.15s ease;
      box-sizing: border-box;
    }
    .submission-input:focus { outline: none; border-color: var(--accent-color); }
    .submission-input::placeholder { color: var(--text-secondary); opacity: 0.5; }
    .submit-btn {
      align-self: flex-end;
      background-color: var(--accent-color);
      color: var(--bg-main);
      border: 2px solid var(--accent-color);
      padding: 10px 24px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .submit-btn:hover:not(:disabled) { background-color: transparent; color: var(--accent-color); }
    .submit-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }

    .submission-submitted {
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-color);
    }

    .submission-submitted-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-color);
    }

    .submitted-label {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-secondary);
    }

    .expand-btn {
      background: transparent;
      border: none;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 2px 6px;
    }
    .expand-btn:hover { color: var(--text-primary); }

    .submission-text {
      padding: 14px 16px;
      font-size: 0.85rem;
      line-height: 1.7;
      color: var(--text-primary);
      white-space: pre-wrap; /* preserves line breaks from textarea */
    }
  `
})

export class Main implements OnInit {
  constructor(private chatService: ChatService) {}

  curricula         = signal<any[]>([]);
  activeCurriculum  = signal<any>(null);
  activeModuleIndex = signal<number | null>(null);
  activeTopicIndex  = signal<number | null>(null);
  assignmentDraft   = signal<string>('');
  researchDraft     = signal<string>('');
  isSubmitting      = signal<boolean>(false);
  isGeneratingTopic = signal<boolean>(false);

  assignmentExpanded = signal<boolean>(true);
  researchExpanded   = signal<boolean>(true);

  activeTopic = () => {
    const curriculum = this.activeCurriculum();
    const mIdx = this.activeModuleIndex();
    const tIdx = this.activeTopicIndex();
    if (!curriculum || mIdx === null || tIdx === null) return null;
    return curriculum.modules?.[mIdx]?.topics?.[tIdx] ?? null;
  };

  ngOnInit() {
    this.loadCurricula();
  }

  private loadCurricula() {
    this.chatService.getLearningCurricula().subscribe({
      next: (res) => this.curricula.set(res.curricula ?? []),
      error: (err) => console.error('[main] loadCurricula failed:', err.message)
    });
  }

  handleSelectCurriculum(id: string) {
    this.chatService.getLearningCurriculumById(id).subscribe({
      next: (res) => {
        this.activeCurriculum.set(res.curriculum ?? res);
        this.activeModuleIndex.set(null);
        this.activeTopicIndex.set(null);
        this.clearDrafts();
      },
      error: (err) => console.error('[main] handleSelectCurriculum failed:', err.message)
    });
  }

  handleSelectTopic(event: { moduleIndex: number; topicIndex: number }) {
    this.activeModuleIndex.set(event.moduleIndex);
    this.activeTopicIndex.set(event.topicIndex);
    this.clearDrafts();
  }

  handleGenerateTopic(event: { moduleIndex: number; topicIndex: number }) {
    const learningCurriculumId = this.activeCurriculum()?._id;
    const curriculumId = this.activeCurriculum()?.curriculumId;
    if (!learningCurriculumId || !curriculumId) return;

    // Switch to the topic being generated so the user sees the loading state
    this.activeModuleIndex.set(event.moduleIndex);
    this.activeTopicIndex.set(event.topicIndex);
    this.isGeneratingTopic.set(true);

    this.chatService.generateTopicContent(learningCurriculumId, {
      moduleIndex: event.moduleIndex,
      topicIndex: event.topicIndex,
    }).subscribe({
      next: () => {
        this.isGeneratingTopic.set(false);
        this.refreshActiveCurriculum();
      },
      error: (err) => {
        console.error('[main] handleGenerateTopic failed:', err.message);
        this.isGeneratingTopic.set(false);
      }
    });
  }
  handleDeleteCurriculum(id: string) {
    this.chatService.deleteLearningCurriculum(id).subscribe({
      next: () => {
        if (this.activeCurriculum()?._id === id) {
          this.activeCurriculum.set(null);
          this.activeModuleIndex.set(null);
          this.activeTopicIndex.set(null);
        }
        this.loadCurricula(); // refresh the list
      },
      error: (err) => console.error('[main] deleteCurriculum failed:', err.message)
    });
  }

  parseMarkdown(content: string): string {
    if (!content) return '';
    return marked.parse(content) as string;
  }


  submitAssignment() {
    const id = this.activeCurriculum()?._id;
    const mIdx = this.activeModuleIndex();
    const tIdx = this.activeTopicIndex();
    if (!id || mIdx === null || tIdx === null) return;

    this.isSubmitting.set(true);
    this.chatService.updateTopicContent(id, {
      moduleIndex: mIdx,
      topicIndex: tIdx,
      field: 'assignment',
      value: this.assignmentDraft()
    }).subscribe({
      next: () => {
        this.assignmentDraft.set('');
        this.isSubmitting.set(false);
        this.refreshActiveCurriculum();
      },
      error: (err) => {
        console.error('[main] submitAssignment failed:', err.message);
        this.isSubmitting.set(false);
      }
    });
  }

  submitResearch() {
    const id = this.activeCurriculum()?._id;
    const mIdx = this.activeModuleIndex();
    const tIdx = this.activeTopicIndex();
    if (!id || mIdx === null || tIdx === null) return;

    this.isSubmitting.set(true);
    this.chatService.updateTopicContent(id, {
      moduleIndex: mIdx,
      topicIndex: tIdx,
      field: 'research',
      value: this.researchDraft()
    }).subscribe({
      next: () => {
        this.researchDraft.set('');
        this.isSubmitting.set(false);
        this.refreshActiveCurriculum();
      },
      error: (err) => {
        console.error('[main] submitResearch failed:', err.message);
        this.isSubmitting.set(false);
      }
    });
  }

  private refreshActiveCurriculum() {
    const id = this.activeCurriculum()?._id;
    if (!id) return;
    this.chatService.getLearningCurriculumById(id).subscribe({
      next: (res) => this.activeCurriculum.set(res.curriculum ?? res),
      error: (err) => console.error('[main] refreshActiveCurriculum failed:', err.message)
    });
  }

  private clearDrafts() {
    this.assignmentDraft.set('');
    this.researchDraft.set('');
  }
}
