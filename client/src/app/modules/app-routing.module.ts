import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutPageComponent } from '../pages/about-page/about-page/about-page.component';
import { ContactPageComponent } from '../pages/contact-page/content-page/contact-page.component';
import { LandingPageComponent } from '../pages/landing-page/landing-page/landing-page.component';
import { SolutionsPageComponent } from '../pages/solutions-page/solutions-page/solutions-page.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LandingPageComponent },
  { path: 'about', component: AboutPageComponent},
  { path: 'solutions', component: SolutionsPageComponent },
  { path: 'contact', component: ContactPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})

export class AppRoutingModule { }
