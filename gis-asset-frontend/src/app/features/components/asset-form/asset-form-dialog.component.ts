import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AssetStore } from '../../../core/state/asset.store';
import { AssetApiError } from '../../../core/services/asset.service';
import {
  Asset,
  AssetStatus,
  AssetType,
  ASSET_STATUSES,
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  LatLngPoint,
} from '../../../core/models';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-asset-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    InputNumberModule,
    ButtonModule,
  ],
  templateUrl: './asset-form-dialog.component.html',
  styleUrls: ['./asset-form-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AssetFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AssetStore);
  private readonly messageService = inject(MessageService);

  @Input() asset: Asset | null = null;
  @Input() visible = false;
  @Input() prefillCenter: LatLngPoint | null = null;

  @Output() readonly visibleChange = new EventEmitter<boolean>();
  @Output() readonly saved = new EventEmitter<Asset>();

  readonly submitting = signal(false);

  readonly typeOptions: SelectOption<AssetType>[] = ASSET_TYPES.map((type) => ({
    label: ASSET_TYPE_LABELS[type],
    value: type,
  }));
  readonly statusOptions: SelectOption<AssetStatus>[] = ASSET_STATUSES.map((status) => ({
    label: status,
    value: status,
  }));

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]),
    type: this.fb.control<AssetType | null>(null, [Validators.required]),
    status: this.fb.nonNullable.control<AssetStatus>('ACTIVE', [Validators.required]),
    description: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
    latitude: this.fb.control<number | null>(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: this.fb.control<number | null>(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  get isEditMode(): boolean {
    return this.asset !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      type: raw.type as AssetType,
      status: raw.status,
      description: raw.description || null,
      latitude: raw.latitude as number,
      longitude: raw.longitude as number,
    };

    this.submitting.set(true);
    const request$ = this.isEditMode
      ? this.store.updateAsset(this.asset!.id, payload)
      : this.store.createAsset(payload);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (result) => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode ? 'Asset updated' : 'Asset created',
          detail: result.name,
          life: 4000,
        });
        this.saved.emit(result);
        this.close();
      },
      error: (err: AssetApiError) => {
        this.messageService.add({ severity: 'error', summary: 'Save failed', detail: err.message, life: 6000 });
      },
    });
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  private resetForm(): void {
    if (this.asset) {
      this.form.reset({
        name: this.asset.name,
        type: this.asset.type,
        status: this.asset.status,
        description: this.asset.description ?? '',
        latitude: this.asset.latitude,
        longitude: this.asset.longitude,
      });
    } else {
      this.form.reset({
        name: '',
        type: null,
        status: 'ACTIVE',
        description: '',
        latitude: this.prefillCenter?.lat ?? null,
        longitude: this.prefillCenter?.lng ?? null,
      });
    }
  }
}
