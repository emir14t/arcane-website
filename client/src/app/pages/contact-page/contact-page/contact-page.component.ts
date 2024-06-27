import { Component } from '@angular/core';
import { EmailService } from "../../../services/email.service";

@Component({
  selector: 'app-contact-page',
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss']
})
export class ContactPageComponent {
  name: string = '';
  firstName: string = '';
  email: string = '';
  message: string = '';

  constructor(private readonly emailService: EmailService) {}

  async sendEmail(): Promise<void> {
    if (this.name !== '' && this.firstName !== '' && this.email !== '' && this.message !== '') {
      await this.emailService.sendEmail(this.firstName, this.name, this.email, this.message);
      this.name = '';
      this.email = '';
      this.message = '';
      this.firstName = '';
    }
  }
}
