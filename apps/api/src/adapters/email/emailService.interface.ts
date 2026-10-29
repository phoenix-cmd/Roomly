export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailService {
  sendEmail(params: SendEmailParams): Promise<boolean>;
  sendBookingConfirmation(booking: any): Promise<boolean>;
  sendCancellationNotification(booking: any): Promise<boolean>;
}
