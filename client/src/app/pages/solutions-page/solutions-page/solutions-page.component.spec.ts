import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolutionsPageComponent } from './solutions-page.component';

describe('SolutionsPageComponent', () => {
  let component: SolutionsPageComponent;
  let fixture: ComponentFixture<SolutionsPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SolutionsPageComponent]
    });
    fixture = TestBed.createComponent(SolutionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
