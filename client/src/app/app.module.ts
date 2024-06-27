import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import FormsModule


import { AppRoutingModule } from './modules/app-routing.module';
import { AppComponent } from './pages/app/app.component';
import { LandingPageComponent } from './pages/landing-page/landing-page/landing-page.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AboutPageComponent } from './pages/about-page/about-page/about-page.component';
import { SolutionsPageComponent } from './pages/solutions-page/solutions-page/solutions-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page/contact-page.component'
import { TecPageComponent } from './pages/tec-page/tec-page/tec-page.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    HeaderComponent,
    FooterComponent,
    AboutPageComponent,
    SolutionsPageComponent,
    ContactPageComponent,
    TecPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
