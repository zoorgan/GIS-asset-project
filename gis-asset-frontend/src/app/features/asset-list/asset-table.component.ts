import { Component, ElementRef, EventEmitter, Output, effect, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService, SharedModule } from 'primeng/api'; // 👈 ضفنا SharedModule هنا
import { AssetStore } from '../../core/state/asset.store';
import { AuthStore } from '../../core/state/auth.store';
import { AssetApiError } from '../../core/services/asset.service';
import { Asset, AssetStatus, ASSET_TYPE_LABELS } from '../../core/models';
import { formatDistance, hasDistance } from '../../core/utils/asset-format.util';

type StatusSeverity = 'success' | 'warning' | 'danger';

const STATUS_SEVERITY: Record<AssetStatus, StatusSeverity> = {
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  INACTIVE: 'danger',
};

@Component({
  selector: 'app-asset-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    SharedModule // 👈 ضفناها هنا في الـ imports
  ],
  templateUrl: './asset-table.component.html',
  styleUrls: ['./asset-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AssetTableComponent {
  readonly store = inject(AssetStore);
  protected readonly authStore = inject(AuthStore);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly assetTypeLabels = ASSET_TYPE_LABELS;
  readonly statusSeverity = STATUS_SEVERITY;
  readonly hasDistance = hasDistance;
  readonly formatDistance = formatDistance;

  @Output() readonly viewDetails = new EventEmitter<Asset>();
  @Output() readonly editAsset = new EventEmitter<Asset>();

  constructor() {
    effect(() => {
      const id = this.store.selectedAssetId();
      if (id) {
        queueMicrotask(() => this.scrollRowIntoView(id));
      }
    });
  }

  onRowClick(asset: Asset): void {
    this.store.selectAsset(asset.id);
  }

  onViewDetailsClick(asset: Asset, event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(asset);
  }

  onEditClick(asset: Asset, event: Event): void {
    event.stopPropagation();
    this.editAsset.emit(asset);
  }

  onDeleteClick(asset: Asset, event: Event): void {
    event.stopPropagation();

    this.confirmationService.confirm({
      header: 'Delete Asset',
      message: `Delete "${asset.name}"? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.deleteAsset(asset),
    });
  }

  typeLabel(asset: Asset): string {
    return this.assetTypeLabels[asset.type];
  }

  severity(asset: Asset): StatusSeverity {
    return this.statusSeverity[asset.status];
  }

  private deleteAsset(asset: Asset): void {
    this.store.deleteAsset(asset.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Asset deleted', detail: asset.name, life: 4000 });
      },
      error: (err: AssetApiError) => {
        this.messageService.add({ severity: 'error', summary: 'Delete failed', detail: err.message, life: 6000 });
      },
    });
  }

  private scrollRowIntoView(assetId: string): void {
    const row = this.elementRef.nativeElement.querySelector<HTMLElement>(
      `tr[data-asset-id="${assetId}"]`
    );
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
