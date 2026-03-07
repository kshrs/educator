import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConfigResponse {
  apiKeyStatus: 'set' | 'empty';
  apiKeyPreview: string;
  modelName: string;
}

export interface HealthResponse {
  status: 'ok' | 'invalid' | 'no_key' | 'error';
  message: string;
}

export interface SaveResponse {
  success: boolean;
}

export interface CurriculumDoc {
  _id: string;
  topic: string;
  iterations: { iterationNumber: number; userPrompt: string; markdownResponse: string }[];
  selectedIterationIndex: number | null;
  status: 'iterating' | 'finalized';
  finalizedCurriculum: any | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // --- Health / Config ---
  getConfig(): Observable<ConfigResponse> {
    return this.http.get<ConfigResponse>(`${this.base}/health/config`);
  }

  saveConfig(payload: { apiKey?: string; modelName?: string }): Observable<SaveResponse> {
    return this.http.post<SaveResponse>(`${this.base}/health/config`, payload);
  }

  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.base}/health/status`);
  }

  // -- Curriculum Curate ---

  startCurriculum(topic: string): Observable<{ curriculumId: string; topic: string }> {
    return this.http.post<{ curriculumId: string; topic: string }>(
      `${this.base}/curriculum/start`, { topic }
    );
  }

  iterateCurriculum(prompt: string, curriculumId: string): Observable<{ ticketID: string }> {
    return this.http.post<{ ticketID: string }>(
      `${this.base}/curriculum/iterate`, { prompt, curriculumId }
    );
  }

  streamCurriculumIteration(ticketID: string): EventSource {
    return new EventSource(`${this.base}/curriculum/iterate/${ticketID}`);
  }

  selectCurriculumIteration(curriculumId: string, iterationIndex: number): Observable<any> {
    return this.http.put(`${this.base}/curriculum/select`, { curriculumId, iterationIndex });
  }

  finalizeCurriculum(curriculumId: string): Observable<any> {
    return this.http.post(`${this.base}/curriculum/finalize`, { curriculumId });
  }

  getCurriculum(curriculumId: string): Observable<CurriculumDoc> {
    return this.http.get<CurriculumDoc>(`${this.base}/curriculum/${curriculumId}`);
  }

  getCurricula(): Observable<{ curricula: any[] }> {
    return this.http.get<{ curricula: any[] }>(`${this.base}/curriculum/list`);
  }

  // -- Learning Curriculum ---
  createLearningCurriculum(curriculumId: string): Observable<{ learningCurriculumId: string}> {
    return this.http.post<{ learningCurriculumId: string }>(`${this.base}/learning/create/${curriculumId}`, { });
  }
  generateTopicContent(id: string, body: { moduleIndex: number, topicIndex: number }): Observable<any> {
    return this.http.post(`${this.base}/learning/${id}/topic/generate`, body);
  }
  getLearningCurricula(): Observable<{ curricula: any[]}> {
    return this.http.get<{ curricula: any[]}>(`${this.base}/learning/list`);
  }
  getLearningCurriculumById(id: string): Observable<any> {
    return this.http.get(`${this.base}/learning/${id}`);
  }
  updateTopicContent(id: string, body: any): Observable<any> {
    return this.http.patch(`${this.base}/learning/${id}/topic`, body);
  }
  deleteLearningCurriculum(curriculumId: string) {
    return this.http.delete(`${this.base}/learning/${curriculumId}`, { });
  }

}
