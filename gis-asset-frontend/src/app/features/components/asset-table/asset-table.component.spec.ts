import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ConfirmationService, MessageService, Confirmation } from 'primeng/api';
import { AssetTableComponent } from './asset-table.component';
import { AssetStore } from '../../../core/state/asset.store';
import { AuthStore } from '../../../core/state/auth.store';
import { AssetApiError } from '../../../core/services/asset.service';
import { Asset, AssetWithDistance } from '../../../core/models';

describe('AssetTableComponent', () => {
  let component: AssetTableComponent;
  let fixture: ComponentFixture<AssetTableComponent>;
  let assetStoreSpy: jasmine.SpyObj<AssetStore>;
  let authStoreSpy: jasmine.SpyObj<AuthStore>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  const mockAsset: Asset = {
    id: 'asset-1',
    name: 'Main Substation',
    type: 'SUBSTATION',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Main 33kV substation',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const displayedAssetsSignal = signal<(Asset | AssetWithDistance)[]>([mockAsset]);
  const loadingSignal = signal<boolean>(false);
  const selectedAssetIdSignal = signal<string | null>(null);
  const isSpatialSearchActiveSignal = signal<boolean>(false);
  const isAdminSignal = signal<boolean>(true);

  beforeEach(async () => {
    displayedAssetsSignal.set([mockAsset]);
    loadingSignal.set(false);
    selectedAssetIdSignal.set(null);
    isSpatialSearchActiveSignal.set(false);
    isAdminSignal.set(true);

    assetStoreSpy = jasmine.createSpyObj('AssetStore', ['selectAsset', 'deleteAsset'], {
      displayedAssets: displayedAssetsSignal,
      loading: loadingSignal,
      selectedAssetId: selectedAssetIdSignal,
      isSpatialSearchActive: isSpatialSearchActiveSignal,
    });

    authStoreSpy = jasmine.createSpyObj('AuthStore', [], {
      isAdmin: isAdminSignal,
    });

    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [AssetTableComponent],
      providers: [
        provideAnimations(),
        { provide: AssetStore, useValue: assetStoreSpy },
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create asset table component', () => {
    expect(component).toBeTruthy();
  });

  it('should select asset when row is clicked', () => {
    component.onRowClick(mockAsset);
    expect(assetStoreSpy.selectAsset).toHaveBeenCalledWith('asset-1');
  });

  it('should emit viewDetails event when view details button is clicked', () => {
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    spyOn(component.viewDetails, 'emit');

    component.onViewDetailsClick(mockAsset, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.viewDetails.emit).toHaveBeenCalledWith(mockAsset);
  });

  it('should emit editAsset event when edit button is clicked', () => {
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    spyOn(component.editAsset, 'emit');

    component.onEditClick(mockAsset, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.editAsset.emit).toHaveBeenCalledWith(mockAsset);
  });

  it('should trigger confirmation dialog when delete button is clicked and proceed on accept', () => {
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    assetStoreSpy.deleteAsset.and.returnValue(of(undefined as unknown as void));

    confirmationServiceSpy.confirm.and.callFake((config: Confirmation) => {
      if (config.accept) {
        config.accept();
      }
      return confirmationServiceSpy;
    });

    component.onDeleteClick(mockAsset, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(confirmationServiceSpy.confirm).toHaveBeenCalled();
    expect(assetStoreSpy.deleteAsset).toHaveBeenCalledWith('asset-1');
    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success', summary: 'Asset deleted' })
    );
  });

  it('should show error message when delete fails', () => {
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    const apiError = new AssetApiError('Delete restricted', 'DELETE_RESTRICTED', 403);
    assetStoreSpy.deleteAsset.and.returnValue(throwError(() => apiError));

    confirmationServiceSpy.confirm.and.callFake((config: Confirmation) => {
      if (config.accept) {
        config.accept();
      }
      return confirmationServiceSpy;
    });

    component.onDeleteClick(mockAsset, event);

    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error', summary: 'Delete failed' })
    );
  });

  it('should format type labels and determine status severity correctly', () => {
    expect(component.typeLabel(mockAsset)).toBe('Substation');
    expect(component.severity(mockAsset)).toBe('success');
  });
});
