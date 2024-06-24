import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit{
  ngOnInit(): void {
    document.addEventListener('scroll', function () {
      const image = document.getElementById('circuits-img') as HTMLElement;
      const scrollY = window.scrollY;
      const imageContainerHeight = (document.querySelector('.img-container') as HTMLElement ).offsetHeight;

      if (scrollY > imageContainerHeight) {
          image.style.position = 'absolute';
          image.style.top = imageContainerHeight + 'px';
      } else {
          // image.style.position = 'fixed';
          image.style.top = '0';
      }
  });
  }
}
