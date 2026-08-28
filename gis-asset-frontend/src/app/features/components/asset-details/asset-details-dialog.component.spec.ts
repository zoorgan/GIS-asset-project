import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AssetDetailsDialogComponent } from './asset-details-dialog.component';
import { Asset, AssetWithDistance } from '../../../core/models';

describe('AssetDetailsDialogComponent', () => {
  let component: AssetDetailsDialogComponent;
  let fixture: ComponentFixture<AssetDetailsDialogComponent>;

  const mockAsset: Asset = {
    id: 'asset-1',
    name: 'North Water Valve',
    type: 'WATER_VALVE',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Primary inflow control valve',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetDetailsDialogComponent],
      providers: [provideAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create details dialog component', () => {
    expect(component).toBeTruthy();
    expect(component.visible).toBeFalse();
  });

  it('should emit visibleChange false on close()', () => {
    spyOn(component.visibleChange, 'emit');
    component.close();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should display asset details when visible is true and asset is supplied', () => {
    component.asset = mockAsset;
    component.visible = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('North Water Valve');
    expect(compiled.textContent).toContain('Primary inflow control valve');
  });

  it('should show distance row when asset has distanceMeters', () => {
    const assetWithDist: AssetWithDistance = {
      ...mockAsset,
      distanceMeters: 1450,
    };
    component.asset = assetWithDist;
    component.visible = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1.45 km');
  });
});
