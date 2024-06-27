import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  isMenuOpen: boolean = false;

  constructor() { }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
