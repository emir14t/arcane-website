import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphSimulationComponent } from './graph-simulation.component';

describe('GraphSimulationComponent', () => {
  let component: GraphSimulationComponent;
  let fixture: ComponentFixture<GraphSimulationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GraphSimulationComponent]
    });
    fixture = TestBed.createComponent(GraphSimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
