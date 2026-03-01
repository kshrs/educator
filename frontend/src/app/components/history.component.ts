import { Component, input, output } from '@angular/core';
import { parse } from 'marked';

@Component({
  selector: 'app-history',
  template: `
  <button (click)="onDeleteClick()">Delete History</button><br>
  @for (pair of chatHistory(); track $index) {
    <div class="role">
    @if (pair.role == "user") {
      <span>{{ userName().toUpperCase() }}</span>
    } @else {
      <span>{{ pair.role.toUpperCase() }}</span>
    }
    </div>
    <div class="content">
    <span [innerHTML]="parseContent(pair.parts[0].text)"></span>
    </div>
  } @empty {
    <span> No chat history </span>
  }
  `,
  styles: `
  .role {
    padding-left: 10px;
    font-size: 20px;
  }

  .content {
    padding-left: 20px;
  }
  `
})

export class History {
  chatHistory = input<any[]>([]);
  userName = input<string>('');
  deleteHistory = output<void>();

  onDeleteClick() {
    this.deleteHistory.emit();
  }

  parseContent(content: string): string {
      const truncated: string = (content.length > 20) ? content.slice(0, 20) + "..." : content;
      return parse(truncated) as string;
  }

}
