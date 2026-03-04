import { Routes } from '@angular/router';
import { StartDashboard } from './start.component';
import { CurriculumGenerator } from './curriculum.component';
import { CheckHealth } from './checkHealth.component';

export const routes: Routes = [
  { path: '', component: StartDashboard },
  { path: 'curriculumGenerator', component: CurriculumGenerator },
  { path: 'health', component: CheckHealth},
  { path: '**', redirectTo: ''}
];
