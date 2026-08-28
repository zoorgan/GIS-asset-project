import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AssetMapComponent } from '../map/asset-map.component';
import { AssetControlsComponent } from '../asset-list/asset-controls.component';
import { AssetTableComponent } from '../asset-list/asset-table.component';
import { AssetDetailsDialogComponent } from '../asset-list/asset-details-dialog.component';
import { AssetFormDialogComponent } from '../asset-list/asset-form-dialog.component';
import { AssetStore } from '../../core/state/asset.store';
import { AuthStore } from '../../core/state/auth.store';
import { Asset, AssetWithDistance, LatLngPoint } from '../../core/models';


@Component({
  selector: 'app-asset-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    AssetMapComponent,
    AssetControlsComponent,
    AssetTableComponent,
    AssetDetailsDialogComponent,
    AssetFormDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './asset-workspace.component.html',
  styleUrls: ['./asset-workspace.component.scss'],
})
export class AssetWorkspaceComponent implements OnInit {
  readonly store = inject(AssetStore);
  protected readonly authStore = inject(AuthStore);
  private readonly messageService = inject(MessageService);


  readonly pendingSearchCenter = signal<LatLngPoint | null>(null);

  readonly detailsAsset = signal<Asset | AssetWithDistance | null>(null);
  readonly detailsVisible = signal(false);


  readonly formAsset = signal<Asset | null>(null);
  readonly formVisible = signal(false);

  constructor() {

    effect(
      () => {
        const message = this.store.error();
        if (message) {
          this.messageService.add({ severity: 'error', summary: 'Something went wrong', detail: message, life: 6000 });
          this.store.clearError();
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.loadAssets();
  }

  onMapClick(point: LatLngPoint): void {
    this.pendingSearchCenter.set(point);
  }

  onViewDetails(asset: Asset): void {
    this.detailsAsset.set(asset);
    this.detailsVisible.set(true);
  }

  onDetailsVisibleChange(visible: boolean): void {
    this.detailsVisible.set(visible);
  }

  openCreateDialog(): void {
    this.formAsset.set(null);
    this.formVisible.set(true);
  }

  onEditAsset(asset: Asset): void {
    this.formAsset.set(asset);
    this.formVisible.set(true);
  }

  onFormVisibleChange(visible: boolean): void {
    this.formVisible.set(visible);
  }

  onAssetSaved(asset: Asset): void {
    this.store.selectAsset(asset.id);
  }
}
