import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AssetFormDialogComponent } from './asset-form-dialog.component';
import { AssetStore } from '../../../core/state/asset.store';
import { AssetApiError } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models';

describe('AssetFormDialogComponent', () => {
  let component: AssetFormDialogComponent;
  let fixture: ComponentFixture<AssetFormDialogComponent>;
  let assetStoreSpy: jasmine.SpyObj<AssetStore>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  const mockAsset: Asset = {
    id: 'asset-1',
    name: 'Existing Valve',
    type: 'WATER_VALVE',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Old valve description',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    assetStoreSpy = jasmine.createSpyObj('AssetStore', ['createAsset', 'updateAsset']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [AssetFormDialogComponent],
      providers: [
        provideAnimations(),
        { provide: AssetStore, useValue: assetStoreSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create asset form dialog component', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode).toBeFalse();
  });

  it('should populate form when opening in edit mode', () => {
    component.asset = mockAsset;
    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true),
    });

    expect(component.isEditMode).toBeTrue();
    expect(component.form.controls.name.value).toBe('Existing Valve');
    expect(component.form.controls.type.value).toBe('WATER_VALVE');
    expect(component.form.controls.latitude.value).toBe(31.95);
    expect(component.form.controls.longitude.value).toBe(35.91);
  });

  it('should prefill latitude and longitude in create mode if prefillCenter provided', () => {
    component.asset = null;
    component.prefillCenter = { lat: 32.01, lng: 35.88 };
    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, true),
    });

    expect(component.isEditMode).toBeFalse();
    expect(component.form.controls.latitude.value).toBe(32.01);
    expect(component.form.controls.longitude.value).toBe(35.88);
  });

  it('should call store.createAsset on valid create submission', () => {
    const created: Asset = { ...mockAsset, id: 'new-id', name: 'New Hydrant', type: 'FIRE_HYDRANT' };
    assetStoreSpy.createAsset.and.returnValue(of(created));
    spyOn(component.saved, 'emit');
    spyOn(component.visibleChange, 'emit');

    component.asset = null;
    component.form.setValue({
      name: 'New Hydrant',
      type: 'FIRE_HYDRANT',
      status: 'ACTIVE',
      description: 'Corner hydrant',
      latitude: 31.95,
      longitude: 35.91,
    });

    component.submit();

    expect(assetStoreSpy.createAsset).toHaveBeenCalledWith({
      name: 'New Hydrant',
      type: 'FIRE_HYDRANT',
      status: 'ACTIVE',
      description: 'Corner hydrant',
      latitude: 31.95,
      longitude: 35.91,
    });
    expect(messageServiceSpy.add).toHaveBeenCalled();
    expect(component.saved.emit).toHaveBeenCalledWith(created);
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should call store.updateAsset on valid update submission', () => {
    const updated: Asset = { ...mockAsset, name: 'Updated Valve Name' };
    assetStoreSpy.updateAsset.and.returnValue(of(updated));
    spyOn(component.saved, 'emit');

    component.asset = mockAsset;
    component.form.setValue({
      name: 'Updated Valve Name',
      type: 'WATER_VALVE',
      status: 'MAINTENANCE',
      description: 'Updated description',
      latitude: 31.95,
      longitude: 35.91,
    });

    component.submit();

    expect(assetStoreSpy.updateAsset).toHaveBeenCalledWith('asset-1', {
      name: 'Updated Valve Name',
      type: 'WATER_VALVE',
      status: 'MAINTENANCE',
      description: 'Updated description',
      latitude: 31.95,
      longitude: 35.91,
    });
    expect(component.saved.emit).toHaveBeenCalledWith(updated);
  });

  it('should show error toast when save operation fails', () => {
    const apiError = new AssetApiError('Validation failed', 'VALIDATION_ERROR', 400);
    assetStoreSpy.createAsset.and.returnValue(throwError(() => apiError));

    component.asset = null;
    component.form.setValue({
      name: 'Invalid Asset',
      type: 'WATER_VALVE',
      status: 'ACTIVE',
      description: '',
      latitude: 31.95,
      longitude: 35.91,
    });

    component.submit();

    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error', summary: 'Save failed' })
    );
  });
});
