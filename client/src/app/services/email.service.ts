import { Injectable } from '@angular/core';
import * as emailJS from '@emailjs/browser'
@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly publicKey: string = '4Bv6ChscQPvl1OcVK';
  private readonly serviceID: string = 'service_kqpyir9';
  private readonly templateID: string = 'template_2y7sc7s';
  constructor() {
    emailJS.init(this.publicKey)
  }
  sendEmail(firstName: string, name: string, email: string, message: string) : void {
    const msg = {
      from_name: firstName + ', ' + name,
      from_email: email,
      message: message,
    };

    emailJS.send(this.serviceID, this.templateID, msg)
      .then(() => { alert('We received your email and will get in touch shortly!') })
      .catch(() => { alert('Something is up on our end... Please try emailing us directly.') });
  }
}
