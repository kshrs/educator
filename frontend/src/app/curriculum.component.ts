import { Component, signal, OnInit } from '@angular/core';
import { ChatService } from './services/chat';
import { Header } from './components/header.component';
import { Input } from './components/input.component';
import { CurriculumChat } from './components/curriculumChat.component';
import { CurriculumSidebar, CurriculumIteration } from './components/curriculumSidebar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-curriculum-generator',
  imports: [Header, Input, CurriculumChat, CurriculumSidebar],
  templateUrl: 'curriculum.component.html',
  styleUrl: 'curriculum.component.css'
})
export class CurriculumGenerator implements OnInit {
  constructor(private chatService: ChatService, private router: Router) {}

  // Curriculum session state
  curriculumId = signal<string | null>(null);
  iterations = signal<CurriculumIteration[]>([]);
  selectedIndex = signal<number | null>(null);

  // Live streaming state
  submittedPrompt = signal('');
  llmResponse = signal('');

  // UI state
  isStreaming = signal(false);
  isFinalizing = signal(false);
  finalizedCurriculum = signal<any | null>(null);

  ngOnInit() {
    // Nothing to load on init for now — curriculum starts fresh each session.
    // When persistence across page reloads is needed, store curriculumId in
    // localStorage and call this.chatService.getCurriculum(id) here.
  }

  // Called by the input component when the user submits a prompt.
  handleUserPrompt(promptInput: string) {
    if (this.isStreaming()) return; // debounce — don't allow double-submit mid-stream

    this.submittedPrompt.set(promptInput);
    this.llmResponse.set('');

    if (!this.curriculumId()) {
      // First prompt — create the curriculum document first, then iterate
      this.chatService.startCurriculum(promptInput).subscribe({

        next: (res) => {
          this.curriculumId.set(res.curriculumId);
          this.runIteration(promptInput, res.curriculumId);
        },
        error: (err) => console.error('[curriculum] startCurriculum failed:', err.message)
      });
    } else {
      // Subsequent prompts — curriculum already exists, iterate directly
      this.runIteration(promptInput, this.curriculumId()!);
    }
  }

  private runIteration(prompt: string, curriculumId: string) {
    this.isStreaming.set(true);

    this.chatService.iterateCurriculum(prompt, curriculumId).subscribe({
      next: (res) => {
        this.streamIteration(res.ticketID);
      },
      error: (err) => {
        console.error('[curriculum] iterateCurriculum failed:', err.message);
        this.isStreaming.set(false);
      }
    });
  }

  private streamIteration(ticketID: string) {
    const eventSource = this.chatService.streamCurriculumIteration(ticketID);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.includes('stream closed')) {
          const newIndex = this.iterations().length; // capture BEFORE update

          this.iterations.update(current => [
            ...current,
            {
              iterationNumber: current.length + 1,
              userPrompt: this.submittedPrompt(),
              markdownResponse: this.llmResponse()
            }
          ]);

          this.llmResponse.set('');
          this.isStreaming.set(false);
          eventSource.close();
          setTimeout(() => this.scrollToIteration(newIndex), 0);
          return;
        }

        this.llmResponse.update(current => current + data);

      } catch (e) {
        console.error('[curriculum] stream parse error:', e);
        this.isStreaming.set(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      this.llmResponse.set('Error generating curriculum.');
      this.isStreaming.set(false);
      eventSource.close();
    };
  }

  // Called when the user clicks an iteration card in CurriculumChat or CurriculumSidebar.
  handleSelectIteration(index: number) {
    if (!this.curriculumId()) return;

    if (this.selectedIndex() === index) {
      this.selectedIndex.set(null);
      return;
    }

    this.selectedIndex.set(index);
    this.scrollToIteration(index);  // ← scroll immediately on click

    this.chatService.selectCurriculumIteration(this.curriculumId()!, index).subscribe({
      error: (err) => console.error('[curriculum] selectIteration failed:', err.message)
    });
  }

  private scrollToIteration(index: number) {
    const el = document.getElementById(`iteration-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Called by the Header's fixCurriculum output — finalizes the selected iteration.
  handleFinalize() {
    if (!this.curriculumId() || this.selectedIndex() === null) return;
    this.isFinalizing.set(true);

    this.chatService.finalizeCurriculum(this.curriculumId()!).subscribe({
      next: (res) => {
        this.finalizedCurriculum.set(res.finalizedCurriculum);
        this.isFinalizing.set(false);

        this.chatService.createLearningCurriculum(this.curriculumId()!).subscribe({
          next: (res) => {
            this.router.navigate(['/main']);
          },
          error: (err) => {
            console.error('[curriculum] finalized curriculum generation failed:', err.message);
            this.isFinalizing.set(false);
          }
        })
      },
      error: (err) => {
        console.error('[curriculum] finalize failed:', err.message);
        this.isFinalizing.set(false);
      }

    });
  }

  // Called by CurriculumSidebar's clearIterations output.
  handleClearIterations() {
    this.curriculumId.set(null);
    this.iterations.set([]);
    this.selectedIndex.set(null);
    this.llmResponse.set('');
    this.submittedPrompt.set('');
    this.finalizedCurriculum.set(null);
  }
}
