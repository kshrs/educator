import { Component, input, computed} from '@angular/core';
import { parse } from 'marked';

@Component({
  selector: 'app-chat',
  template:`
  <div class="markdown-content" [innerHTML]="parsedContent()"></div>
  `,
})

export class Chat {
  llmResponse = input<string>('');

  parsedContent = computed(() => {
    return parse(this.llmResponse()) as string;
  })
}
