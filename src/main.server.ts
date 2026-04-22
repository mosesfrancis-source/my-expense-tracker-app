import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { getApps, initializeApp } from 'firebase/app';
import { environment } from './environments/environment';

if (getApps().length === 0) {
  initializeApp(environment.firebase);
}

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
