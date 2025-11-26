import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractiveNetworkComponent } from './interactive-network.component';

describe('InteractiveNetworkComponent', () => {
  let component: InteractiveNetworkComponent;
  let fixture: ComponentFixture<InteractiveNetworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InteractiveNetworkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractiveNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default color map', () => {
    expect(component.colorMap).toBeDefined();
    expect(component.colorMap['Increase']).toBe('#ff0000');
    expect(component.colorMap['Decrease']).toBe('#0000ff');
  });

  it('should accept gene inputs', () => {
    component.selectedGenes = ['GENE1'];
    component.increaseGenes = ['GENE2'];
    component.decreaseGenes = ['GENE3'];
    component.allGenes = ['GENE1', 'GENE2', 'GENE3', 'GENE4'];

    expect(component.selectedGenes.length).toBe(1);
    expect(component.increaseGenes.length).toBe(1);
    expect(component.decreaseGenes.length).toBe(1);
    expect(component.allGenes.length).toBe(4);
  });

  it('should emit node click events', (done) => {
    component.nodeClick.subscribe((event) => {
      expect(event.nodeId).toBeDefined();
      expect(event.nodeName).toBeDefined();
      done();
    });

    const mockElement = {
      id: 'node.ENSP00000000001',
      getAttribute: () => 'TP53',
      hasMoved: false
    };

    const mockEvent = new MouseEvent('click');
    (component as any).handleNodeClick(mockEvent, mockElement);
  });

  it('should emit edge click events', (done) => {
    component.edgeClick.subscribe((event) => {
      expect(event.node1).toBe('ENSP00000000001');
      expect(event.node2).toBe('ENSP00000000002');
      done();
    });

    const mockElement = {
      id: 'edge.ENSP00000000001.ENSP00000000002'
    };

    const mockEvent = new MouseEvent('click');
    (component as any).handleEdgeClick(mockEvent, mockElement);
  });

  it('should return node positions', () => {
    const positions = component.getNodePositions();
    expect(positions).toBeDefined();
    expect(typeof positions).toBe('object');
  });
});
