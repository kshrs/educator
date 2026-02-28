import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})

export class ChatService {
  private backendurl = 'http://localhost:3000/api';
  constructor(private http: HttpClient) { }

  generateTicket(userPrompt: string) {
    const body = {
      prompt: userPrompt
    };
    return this.http.post(`${this.backendurl}/prompt`, body);
  }

  streamLLMResponse(ticketID: string) {
    return new EventSource(`${this.backendurl}/events/${ticketID}`);
  }
}
