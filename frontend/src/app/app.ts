import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatService } from './services/chat';
import { Header } from './components/header.component';
import { Input } from './components/input.component';
import { Chat } from './components/chat.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Input, Chat],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {

  prompt = signal('');
  ticket = signal('');
  llmResponse = signal('');

  constructor(private chatService: ChatService) { }

  handleUserPrompt(promptInput: string) {
    this.createTicket(promptInput);
  }

  createTicket(userPrompt: string) {
    this.chatService.generateTicket(userPrompt).subscribe({
      next: (response: any) => {
        if (response && response.ticketID) {
          this.ticket.set(response.ticketID);
          this.getLLMResponse(response.ticketID);
          return;
        }
        this.ticket.set(response.message);
      },
      error: (err) => {
        this.ticket.set(err.message);
      }
    });
  }

  getLLMResponse(ticketID: string) {
    const eventSource = this.chatService.streamLLMResponse(ticketID);
    this.llmResponse.set('');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.includes("stream closed")) {
          this.llmResponse.update(current => current + "\n\nEnd of stream");
          eventSource.close();
          return;
        }
        this.llmResponse.update(current => current + data);
      } catch (e) {
        this.llmResponse.update(current => current + "end by error");
        eventSource.close();
        return;
      }
    }
    eventSource.onopen = () => {
      this.llmResponse.set("Generating Content\n");
    }

    eventSource.onerror = () => {
      this.llmResponse.set("Error Generating Content");
      eventSource.close();
    }

  }

}
