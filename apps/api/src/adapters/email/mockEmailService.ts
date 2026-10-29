import { IEmailService, SendEmailParams } from './emailService.interface.js';
import { logger } from '../../utils/logger.js';

export class MockEmailService implements IEmailService {
  async sendEmail(params: SendEmailParams): Promise<boolean> {
    logger.info(`📧 [MockEmail] To: ${params.to} | Subject: "${params.subject}"`);
    return true;
  }

  async sendBookingConfirmation(booking: any): Promise<boolean> {
    logger.info(`📧 [MockEmail] Booking Confirmation for ${booking.confirmationCode} sent to ${booking.guestDetails?.email}`);
    return true;
  }

  async sendCancellationNotification(booking: any): Promise<boolean> {
    logger.info(`📧 [MockEmail] Cancellation Notification for ${booking.confirmationCode} sent to ${booking.guestDetails?.email}`);
    return true;
  }
}
