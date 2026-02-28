import { Component, signal, output } from '@angular/core';

@Component({
  selector: 'app-input',
  template:`
  <input [value]="currentText()" (input)="currentText.set(entry.value)" #entry placeholder="prompt goes here..." />
  <button (click)="onSubmit(entry.value)">Send it!</button>
  `,
})

export class Input {
  currentText = signal('');

  submitPrompt = output<string>();

  onSubmit(text: string) {
    this.submitPrompt.emit(text);
    this.currentText.set('');
  }
}
