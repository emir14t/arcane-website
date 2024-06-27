import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecPageComponent } from './tec-page.component';

describe('TecPageComponent', () => {
  let component: TecPageComponent;
  let fixture: ComponentFixture<TecPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TecPageComponent]
    });
    fixture = TestBed.createComponent(TecPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
