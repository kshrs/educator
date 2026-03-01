import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatService } from './services/chat';
import { Header } from './components/header.component';
import { Input } from './components/input.component';
import { Chat } from './components/chat.component';
import { History } from './components/history.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Input, Chat, History],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {
  constructor(private chatService: ChatService) { }

  prompt = signal('');
  ticket = signal('');
  llmResponse = signal('');
  history = signal<any[]>([]);
  userName = signal('');

  ngOnInit() {
    this.handleChatHistory();
    this.handleUserName();
  }

  handleDeleteHistory() {
    this.chatService.deleteChatHistory().subscribe({
      next: () => {
        this.handleChatHistory();
      },
      error: (err: any) => {
        console.log(err.message);
      }
    });
  }

  handleUserPrompt(promptInput: string) {
    this.createTicket(promptInput);
  }

  handleUserName() {
    this.chatService.getUserName().subscribe({
      next: (response: any) => {
        if (response && response.username) {
          this.userName.set(response.username)
          return;
        }
      },
      error: (err: any) => {
        console.log(err.message);
      }
    });
  }

  handleChatHistory() {
    this.chatService.getHistory().subscribe({
      next: (response: any) => {
        if (response && response.history) {
          this.history.set(response.history);
        }
      },
      error: (error: any) => {
        console.log(error.message);
      }
    });

  }

  createTicket(userPrompt: string) {
    this.history.update(current => [...current, {role: this.userName(), parts: [ { text: userPrompt }]}]);
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
          this.history.update(current => [...current, {role: 'model', parts: [ { text: this.llmResponse() }]}]);
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
    }

    eventSource.onerror = () => {
      this.llmResponse.set("Error Generating Content");
      eventSource.close();
    }

  }

}
