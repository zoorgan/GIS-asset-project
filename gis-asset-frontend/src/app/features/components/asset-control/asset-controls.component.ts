import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { AssetStore, FILTER_ALL, StatusFilter, TypeFilter } from '../../../core/state/asset.store';
import { ASSET_STATUSES, ASSET_TYPES, ASSET_TYPE_LABELS, LatLngPoint } from '../../../core/models';

interface SelectOption<T> {
  label: string;
  value: T;
}

const MIN_RADIUS_METERS = 50;
const MAX_RADIUS_METERS = 50_000;
const DEFAULT_RADIUS_METERS = 1000;


@Component({
  selector: 'app-asset-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, InputNumberModule, DividerModule],
  templateUrl: './asset-controls.component.html',
  styleUrls: ['./asset-controls.component.scss'],
})
export class AssetControlsComponent {
  readonly store = inject(AssetStore);


  @Input() pendingSearchCenter: LatLngPoint | null = null;

  readonly radiusMeters = signal<number>(DEFAULT_RADIUS_METERS);
  readonly minRadius = MIN_RADIUS_METERS;
  readonly maxRadius = MAX_RADIUS_METERS;

  readonly typeOptions: SelectOption<TypeFilter>[] = [
    { label: 'All Types', value: FILTER_ALL },
    ...ASSET_TYPES.map((type) => ({ label: ASSET_TYPE_LABELS[type], value: type })),
  ];

  readonly statusOptions: SelectOption<StatusFilter>[] = [
    { label: 'All Statuses', value: FILTER_ALL },
    ...ASSET_STATUSES.map((status) => ({ label: status, value: status })),
  ];

  onTypeChange(value: TypeFilter): void {
    this.store.setTypeFilter(value);
  }

  onStatusChange(value: StatusFilter): void {
    this.store.setStatusFilter(value);
  }

  runSpatialSearch(): void {
    if (!this.pendingSearchCenter) return;
    this.store.spatialSearch(this.pendingSearchCenter, this.radiusMeters(), this.store.typeFilter());
  }

  clearSearch(): void {
    this.store.clearSpatialSearch();
  }
}
