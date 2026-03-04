import { Component, output } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <header class="header-container">
      <div class="header-left">
        <h1 class="header-title">Curate Curriculum</h1>
      </div>
      <button class="fix-btn" (click)="fixCurriculum.emit()">
        ↺ Fix Curriculum
      </button>
    </header>
  `,
  styles: `
    /* --- Layout --- */
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 16px 28px;
      border-bottom: 2px solid var(--border-color);
      background-color: var(--bg-main);
      box-sizing: border-box;
    }

    /* --- Title Group --- */
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }

    /* --- Fix Button --- */
    .fix-btn {
      background-color: transparent;
      color: var(--text-primary);
      border: 2px solid var(--accent-color);
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      cursor: pointer;
      padding: 10px 20px;
      min-width: 160px;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .fix-btn:hover {
      background-color: var(--accent-color);
      color: var(--bg-main);
    }

    .fix-btn:disabled {
      border-color: var(--border-color);
      color: var(--text-secondary);
      cursor: not-allowed;
    }
  `
})
export class Header {
  fixCurriculum = output<void>();
}
