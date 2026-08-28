import {
  AfterViewInit,
  Component,
  ElementRef,
  EffectRef,
  EventEmitter,
  Injector,
  NgZone,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import { AssetStore } from '../../core/state/asset.store';
import { Asset, AssetWithDistance } from '../../core/models';
import { MarkerIconFactory, buildPopupContent } from './map-marker.util';

const DEFAULT_CENTER: L.LatLngTuple = [30.0444, 31.2357];
const DEFAULT_ZOOM = 13;
const FLY_TO_ZOOM = 16;
const SELECTED_MARKER_CLASS = 'asset-pin--selected';


@Component({
  selector: 'app-asset-map',
  standalone: true,
  imports: [],
  template: `<div #mapContainer class="asset-map" role="application" aria-label="Asset map"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .asset-map {
        width: 100%;
        height: 100%;
        min-height: 320px;
      }
    `,
  ],
})
export class AssetMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private readonly mapContainerRef!: ElementRef<HTMLDivElement>;

  @Output() readonly mapClick = new EventEmitter<{ lat: number; lng: number }>();

  private readonly store = inject(AssetStore);
  private readonly zone = inject(NgZone);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private searchCircle: L.Circle | null = null;
  private searchCenterMarker: L.CircleMarker | null = null;

  private readonly markerIndex = new Map<string, L.Marker>();
  private readonly iconFactory = new MarkerIconFactory();

  private selectedMarkerId: string | null = null;

  private pendingClickOriginId: string | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private readonly effectRefs: EffectRef[] = [];

  ngAfterViewInit(): void {
    if (!this.isBrowser) {

      return;
    }

    this.zone.runOutsideAngular(() => {
      this.initMap();
      this.initResizeObserver();
    });

    this.registerReactiveSync();
  }

  ngOnDestroy(): void {

    for (const ref of this.effectRefs) {
      ref.destroy();
    }
    this.effectRefs.length = 0;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.map) {
      this.markerLayer?.clearLayers();
      this.markerLayer = null;
      this.searchCircle = null;
      this.searchCenterMarker = null;
      this.markerIndex.clear();
      this.iconFactory.clear();

      this.map.off();
      this.map.remove();
      this.map = null;
    }
  }


  private initMap(): void {
    this.map = L.map(this.mapContainerRef.nativeElement, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.zone.run(() => this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng }));
    });
  }


  private initResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined' || !this.map) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize();
    });
    this.resizeObserver.observe(this.mapContainerRef.nativeElement);
  }


  private registerReactiveSync(): void {
    const markersEffect = effect(
      () => {
        const assets = this.store.displayedAssets();
        const selectedId = this.store.selectedAssetId();
        this.zone.runOutsideAngular(() => {
          this.syncMarkers(assets);
          this.syncSelection(selectedId);
        });
      },
      { injector: this.injector }
    );

    const searchCircleEffect = effect(
      () => {
        const active = this.store.isSpatialSearchActive();
        const center = this.store.searchCenter();
        const radius = this.store.searchRadiusMeters();
        this.zone.runOutsideAngular(() => this.syncSearchCircle(active, center, radius));
      },
      { injector: this.injector }
    );

    this.effectRefs.push(markersEffect, searchCircleEffect);
  }



  private syncMarkers(assets: ReadonlyArray<Asset | AssetWithDistance>): void {
    if (!this.map || !this.markerLayer) return;

    const incomingIds = new Set(assets.map((a) => a.id));

    // Remove markers for assets no longer present.
    for (const [id, marker] of this.markerIndex) {
      if (!incomingIds.has(id)) {
        this.markerLayer.removeLayer(marker);
        this.markerIndex.delete(id);
      }
    }


    for (const asset of assets) {
      const existing = this.markerIndex.get(asset.id);

      if (!existing) {
        const marker = this.createMarker(asset);
        this.markerLayer.addLayer(marker);
        this.markerIndex.set(asset.id, marker);
        continue;
      }


      const currentLatLng = existing.getLatLng();
      if (currentLatLng.lat !== asset.latitude || currentLatLng.lng !== asset.longitude) {
        existing.setLatLng([asset.latitude, asset.longitude]);
      }
      existing.setIcon(this.iconFactory.getIcon(asset.type, asset.status));
      existing.setPopupContent(buildPopupContent(asset));
    }
  }

  private createMarker(asset: Asset | AssetWithDistance): L.Marker {
    const marker = L.marker([asset.latitude, asset.longitude], {
      icon: this.iconFactory.getIcon(asset.type, asset.status),
      alt: asset.name,
    });

    marker.bindPopup(buildPopupContent(asset), { closeButton: true, maxWidth: 280 });


    marker.on('click', () => {
      this.pendingClickOriginId = asset.id;
      this.zone.run(() => this.store.selectAsset(asset.id));
    });

    return marker;
  }


  private syncSelection(selectedId: string | null): void {
    if (this.selectedMarkerId && this.selectedMarkerId !== selectedId) {
      this.markerIndex.get(this.selectedMarkerId)?.getElement()?.classList.remove(SELECTED_MARKER_CLASS);
    }

    this.selectedMarkerId = selectedId;

    if (!selectedId) {
      this.pendingClickOriginId = null;
      return;
    }

    const marker = this.markerIndex.get(selectedId);
    if (!marker || !this.map) {
      this.pendingClickOriginId = null;
      return;
    }

    marker.getElement()?.classList.add(SELECTED_MARKER_CLASS);

    const originatedFromThisMarker = this.pendingClickOriginId === selectedId;
    this.pendingClickOriginId = null;

    if (!originatedFromThisMarker) {

      this.map.flyTo(marker.getLatLng(), Math.max(this.map.getZoom(), FLY_TO_ZOOM), { duration: 0.6 });
    }

    if (!marker.isPopupOpen()) {
      marker.openPopup();
    }
  }



  private syncSearchCircle(
    active: boolean,
    center: { lat: number; lng: number } | null,
    radiusMeters: number
  ): void {
    if (!this.map) return;

    if (!active || !center) {
      if (this.searchCircle) {
        this.map.removeLayer(this.searchCircle);
        this.searchCircle = null;
      }
      if (this.searchCenterMarker) {
        this.map.removeLayer(this.searchCenterMarker);
        this.searchCenterMarker = null;
      }
      return;
    }

    const latLng: L.LatLngTuple = [center.lat, center.lng];

    if (!this.searchCircle) {
      this.searchCircle = L.circle(latLng, {
        radius: radiusMeters,
        color: '#1565C0',
        weight: 2,
        fillColor: '#1565C0',
        fillOpacity: 0.08,
      }).addTo(this.map);
    } else {
      this.searchCircle.setLatLng(latLng);
      this.searchCircle.setRadius(radiusMeters);
    }

    if (!this.searchCenterMarker) {
      this.searchCenterMarker = L.circleMarker(latLng, {
        radius: 6,
        color: '#1565C0',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1,
      }).addTo(this.map);
    } else {
      this.searchCenterMarker.setLatLng(latLng);
    }

    this.map.fitBounds(this.searchCircle.getBounds(), { padding: [40, 40], maxZoom: 17 });
  }
}
