import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Asset, AssetWithDistance, ASSET_TYPE_LABELS } from '../../../core/models';
import { formatDistance, hasDistance } from '../../../core/utils/asset-format.util';


@Component({
  selector: 'app-asset-details-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, TagModule],
  templateUrl: './asset-details-dialog.component.html',
  styleUrls: ['./asset-details-dialog.component.scss'],
})
export class AssetDetailsDialogComponent {
  @Input() asset: Asset | AssetWithDistance | null = null;
  @Input() visible = false;
  @Output() readonly visibleChange = new EventEmitter<boolean>();

  readonly assetTypeLabels = ASSET_TYPE_LABELS;
  readonly hasDistance = hasDistance;
  readonly formatDistance = formatDistance;

  close(): void {
    this.visibleChange.emit(false);
  }
}
