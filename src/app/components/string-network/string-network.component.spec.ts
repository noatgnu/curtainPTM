import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StringNetworkComponent } from './string-network.component';
import { StringNetworkService } from './string-network.service';
import { UniprotService } from '../../uniprot.service';
import { DataService } from '../../data.service';
import { SettingsService } from '../../settings.service';
import { of } from 'rxjs';

describe('StringNetworkComponent', () => {
  let component: StringNetworkComponent;
  let fixture: ComponentFixture<StringNetworkComponent>;
  let stringService: jasmine.SpyObj<StringNetworkService>;

  beforeEach(async () => {
    const stringSpy = jasmine.createSpyObj('StringNetworkService', ['getInteractiveSVGNetwork']);

    await TestBed.configureTestingModule({
      declarations: [StringNetworkComponent],
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule],
      providers: [
        FormBuilder,
        { provide: StringNetworkService, useValue: stringSpy },
        UniprotService,
        DataService,
        SettingsService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StringNetworkComponent);
    component = fixture.componentInstance;
    stringService = TestBed.inject(StringNetworkService) as jasmine.SpyObj<StringNetworkService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default color values', () => {
    expect(component.form.value).toEqual({
      'Increase': '#8d0606',
      'Decrease': '#4f78a4',
      'In dataset': '#ce8080',
      'Not in dataset': '#676666'
    });
  });

  it('should update color when updateColor is called', () => {
    component.updateColor('#ff0000', 'Increase');
    expect(component.form.controls['Increase'].value).toBe('#ff0000');
    expect(component.form.dirty).toBe(true);
  });

  it('should load network when loadNetwork is called', () => {
    stringService.getInteractiveSVGNetwork.and.returnValue(of('<svg>Test SVG</svg>'));
    component.ids = ['TEST1'];
    component.organism = '9606';

    component.loadNetwork();

    expect(stringService.getInteractiveSVGNetwork).toHaveBeenCalled();
  });

  it('should handle node click events', () => {
    spyOn(console, 'log');
    component.handleNodeClick({ nodeId: 'node1', nodeName: 'GENE1', event: new MouseEvent('click') });
    expect(console.log).toHaveBeenCalledWith('Node clicked:', 'GENE1');
  });

  it('should handle edge click events', () => {
    spyOn(console, 'log');
    component.handleEdgeClick({ node1: 'node1', node2: 'node2', event: new MouseEvent('click') });
    expect(console.log).toHaveBeenCalledWith('Edge clicked:', 'node1', 'node2');
  });
});
