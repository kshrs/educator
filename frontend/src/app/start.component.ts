import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-startscreen',
  template: `
    <div class="main-container">

      <div class="bg-grid" aria-hidden="true"></div>

      <div class="top-bar">
        <span class="top-bar-label">Project Educator — v0.0.1</span>
        <span class="top-bar-label">Self-Directed Learning System</span>
      </div>

      <div class="content">

        <div class="left-column">
          <div class="eyebrow">[ Your Curriculum, Your way ]</div>
          <h1 class="title">
            <span class="title-line">Learn</span>
            <span class="title-line accent">Without</span>
            <span class="title-line">Drifting.</span>
          </h1>
          <p class="subtitle">
            Most self-learners quit — not from lack of motivation,
            but lack of structure. Project Educator builds the path
            so you can focus on walking it.
          </p>
        </div>

        <div class="right-column">
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-num">01</span>
              <span class="feature-text">Curate your own curriculum</span>
            </div>
            <div class="feature-item">
              <span class="feature-num">02</span>
              <span class="feature-text">Gather resources from the web</span>
            </div>
            <div class="feature-item">
              <span class="feature-num">03</span>
              <span class="feature-text">Reinforce with tasks &amp; reasoning</span>
            </div>
          </div>

          <div class="cta-block">
            <button class="start-btn" (click)="onStartBtnClick()">
              Start Session
              <span class="btn-arrow">→</span>
            </button>
            <button class="health-btn" (click)="onHealthBtnClick()">
              System Health ·
            </button>
          </div>
        </div>

      </div>

      <div class="bottom-bar">
        <span class="bottom-label">Stay on track. Get it done.</span>
      </div>

    </div>
  `,
  styles: `
    .main-container {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
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
      opacity: 0.35;
      pointer-events: none;
    }

    /* --- Top Bar --- */
    .top-bar {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 40px;
      border-bottom: 2px solid var(--accent-color);
      animation: fade-down 0.4s ease both;
    }

    .top-bar-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--text-secondary);
    }

    /* --- Main Content --- */
    .content {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 40px;
      min-height: 0;
    }

    /* --- Left Column --- */
    .left-column {
      flex: 1.1;
      display: flex;
      flex-direction: column;
      gap: 28px;
      padding-right: 60px;
      border-right: 2px solid var(--border-color);
      animation: fade-up 0.5s ease 0.1s both;
    }

    .eyebrow {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--accent-red);
    }

    .title {
      display: flex;
      flex-direction: column;
      margin: 0;
      line-height: 1;
      gap: 4px;
    }

    .title-line {
      font-size: clamp(3rem, 6vw, 5.5rem);
      font-weight: 900;
      letter-spacing: -3px;
      color: var(--text-primary);
      text-transform: uppercase;
      display: block;
    }

    .title-line.accent {
      color: var(--accent-red);
    }

    .subtitle {
      font-size: 1rem;
      line-height: 1.75;
      color: var(--text-secondary);
      margin: 0;
      max-width: 420px;
      font-weight: 400;
    }

    /* --- Right Column --- */
    .right-column {
      flex: 0.9;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 48px;
      padding-left: 60px;
      animation: fade-up 0.5s ease 0.25s both;
    }

    /* --- Feature List --- */
    .feature-list {
      display: flex;
      flex-direction: column;
    }

    .feature-item {
      display: flex;
      align-items: baseline;
      gap: 20px;
      padding: 18px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .feature-item:first-child {
      border-top: 1px solid var(--border-color);
    }

    .feature-num {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--accent-red);
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    .feature-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* --- CTA Block --- */
    .cta-block {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Primary — solid black, red offset shadow, collapses on hover */
    .start-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background-color: var(--accent-color);
      color: var(--bg-main);
      border: 2px solid var(--accent-color);
      font-weight: 800;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      cursor: pointer;
      padding: 18px 24px;
      box-shadow: 6px 6px 0px var(--accent-red);
      transition: box-shadow 0.15s ease, transform 0.15s ease, background-color 0.15s ease, color 0.15s ease;
    }

    .start-btn:hover {
      background-color: var(--bg-main);
      color: var(--accent-color);
      transform: translate(6px, 6px);
      box-shadow: 0px 0px 0px var(--accent-red);
    }

    .btn-arrow {
      font-size: 1.1rem;
      transition: transform 0.15s ease;
    }

    .start-btn:hover .btn-arrow {
      transform: translateX(4px);
    }

    /* Secondary — ghost, visually subordinate so it doesn't compete with Start */
    .health-btn {
      width: 100%;
      background-color: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      cursor: pointer;
      padding: 12px 24px;
      transition: border-color 0.15s ease, color 0.15s ease;
    }

    .health-btn:hover {
      border-color: var(--accent-color);
      color: var(--text-primary);
    }

    /* --- Bottom Bar --- */
    .bottom-bar {
      position: relative;
      z-index: 1;
      padding: 14px 40px;
      border-top: 2px solid var(--accent-color);
      animation: fade-up 0.4s ease 0.35s both;
    }

    .bottom-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-secondary);
    }

    @keyframes fade-down {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes fade-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
})
export class StartDashboard {
  constructor(private router: Router) {}

  onStartBtnClick() {
    this.router.navigate(['/curriculumGenerator']);
  }

  onHealthBtnClick() {
    this.router.navigate(['/health']);
  }
}
