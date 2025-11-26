import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProteinInfoPanelComponent } from './protein-info-panel.component';
import { StringNetworkService } from '../string-network.service';
import { of, throwError } from 'rxjs';

describe('ProteinInfoPanelComponent', () => {
  let component: ProteinInfoPanelComponent;
  let fixture: ComponentFixture<ProteinInfoPanelComponent>;
  let stringService: jasmine.SpyObj<StringNetworkService>;

  beforeEach(async () => {
    const stringSpy = jasmine.createSpyObj('StringNetworkService', ['getProteinInfo', 'getEdgeInfo']);

    await TestBed.configureTestingModule({
      declarations: [ProteinInfoPanelComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: StringNetworkService, useValue: stringSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProteinInfoPanelComponent);
    component = fixture.componentInstance;
    stringService = TestBed.inject(StringNetworkService) as jasmine.SpyObj<StringNetworkService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load protein info when proteinId is set', () => {
    const mockHtml = '<div>Test protein info</div>';
    stringService.getProteinInfo.and.returnValue(of(mockHtml));

    component.proteinId = 'ENSP00000000001';
    component.visible = true;
    component.loadContent();

    expect(stringService.getProteinInfo).toHaveBeenCalledWith('ENSP00000000001');
    expect(component.loading).toBe(false);
  });

  it('should load edge info when edgeInfo is set', () => {
    const mockHtml = '<div>Test edge info</div>';
    stringService.getEdgeInfo.and.returnValue(of(mockHtml));

    component.edgeInfo = { node1: 'ENSP00000000001', node2: 'ENSP00000000002' };
    component.visible = true;
    component.loadContent();

    expect(stringService.getEdgeInfo).toHaveBeenCalledWith('ENSP00000000001', 'ENSP00000000002');
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading protein info fails', () => {
    stringService.getProteinInfo.and.returnValue(throwError(() => new Error('Failed to load')));

    component.proteinId = 'ENSP00000000001';
    component.visible = true;
    component.loadContent();

    expect(component.error).toBe('Failed to load protein information');
    expect(component.loading).toBe(false);
  });

  it('should emit close event when onClose is called', (done) => {
    component.close.subscribe(() => {
      expect(true).toBe(true);
      done();
    });

    component.onClose();
  });

  it('should calculate panel style with correct position', () => {
    component.position = { x: 100, y: 200 };
    component.visible = true;

    const style = component.panelStyle;

    expect(style.position).toBe('fixed');
    expect(style.left).toBe('100px');
    expect(style.top).toBe('200px');
    expect(style.display).toBe('block');
  });

  it('should hide panel when visible is false', () => {
    component.visible = false;
    const style = component.panelStyle;
    expect(style.display).toBe('none');
  });
});
