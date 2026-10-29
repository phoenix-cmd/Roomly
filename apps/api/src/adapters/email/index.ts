import { IEmailService } from './emailService.interface.js';
import { MockEmailService } from './mockEmailService.js';

let emailServiceInstance: IEmailService;

export function getEmailService(): IEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new MockEmailService();
  }
  return emailServiceInstance;
}

export * from './emailService.interface.js';
export * from './mockEmailService.js';
