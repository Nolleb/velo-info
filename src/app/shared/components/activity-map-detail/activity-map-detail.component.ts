import { Component, input, output, AfterViewInit, effect, OnDestroy } from "@angular/core";
import * as L from 'leaflet';
import { SegmentEffort } from "../../../models/strava.model";

@Component({
  selector: "app-activity-map-detail",
  templateUrl: "./activity-map-detail.component.html",
  styleUrls: ["./activity-map-detail.component.scss"],
  standalone: true,
})

export class ActivityMapDetailComponent implements AfterViewInit, OnDestroy {

  latlng = input<[number, number][] | null | undefined>();
  starredSegments = input<SegmentEffort[] | null | undefined>(); 

  // Output pour envoyer les données au parent
  segmentSelected = output<{
    segment: SegmentEffort;
    topology: {
      distances: number[];
      altitudes: number[];
    }
  }>();

  map: L.Map | null = null;
  mapId = `map-${Math.random().toString(36).substring(2, 11)}`;
  private mapInitialized = false;

  constructor() {
 
    effect(() => {
      const latlngValue = this.latlng();
      if (latlngValue && this.mapInitialized) {
        this.initializeMap(latlngValue);
      }
    });
  }

  ngAfterViewInit() {
    this.mapInitialized = true;
    const latlngValue = this.latlng();
    if (latlngValue) {
      this.initializeMap(latlngValue);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initializeMap(latlngValue: [number, number][]) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Les points sont déjà au format [lat, lng] grâce au store
    const tempPolyline = L.polyline(latlngValue);
    const bounds = tempPolyline.getBounds();
    
    this.map = L.map(this.mapId).fitBounds(bounds);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 5,
    }).addTo(this.map);

    this.loadMap(latlngValue);
    this.setIconsOnMap()
  }

  loadMap(points: [number, number][]) {
    if (!this.map) return;

    L.polyline(points, {
      color: 'red',
      weight: 4,
      opacity: 0.3,
    }).addTo(this.map);

    L.polyline(points, {
      color: 'red',
      weight: 8,
      opacity: 0.15,
    }).addTo(this.map);

    const route = L.polyline(points, {
      color: '#E76D46',
      weight: 2,
      opacity: 1
    }).addTo(this.map);

    L.polyline(points, {
      renderer: L.canvas()
    }).addTo(this.map);

    this.map.fitBounds(route.getBounds());
    
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  setIconsOnMap() {
    if (!this.map) return;
    
    this.starredSegments()?.forEach(segment => {
      // Calculer le point du milieu entre start_latlng et end_latlng
      const start = segment.segment.start_latlng;
      const end = segment.segment.end_latlng;
      const middleLat = (start[0] + end[0]) / 2;
      const middleLng = (start[1] + end[1]) / 2;

      const starIcon = L.divIcon({
        html: `<svg width="25" height="20" version="1.1" viewBox="-5 -10 93.996 74.616" xmlns="http://www.w3.org/2000/svg">
              <path fill="#AFE2FF" d="m87.478 64.616h-90.961c-0.55078 0-1.0586-0.30078-1.3281-0.78906-0.26953-0.48047-0.25-1.0781 0.050782-1.5391l45.477-71.629c0.55078-0.87891 2.0117-0.87891 2.5586 0l45.48 71.621c0.30078 0.46875 0.32031 1.0586 0.05078 1.5391-0.26953 0.48828-0.76953 0.78906-1.3281 0.78906z"/>
              <path fill="#fff" d="m37.697 35.147h-0.07813c-0.60156-0.03125-1.1211-0.41016-1.3281-0.96875l-2.3008-6.0117-1.9102-1.7305-1.7695 4.3203c-0.23047 0.57031-0.78125 0.94141-1.3984 0.94141-0.60937 0-1.1602-0.37109-1.3984-0.92969l-4.4883-10.77c-0.32031-0.76953 0.03906-1.6602 0.82031-1.9805 0.76953-0.32031 1.6602 0.03906 1.9805 0.82031l16.119-24.843 16.354 24.984c0.25-0.80078 1.0898-1.25 1.8984-1 0.80078 0.25 1.25 1.0898 1 1.8984l-4.0312 13.121c-0.17969 0.57812-0.69141 1-1.3008 1.0586-0.60938 0.05078-1.1914-0.25-1.4805-0.78125l-3.4805-6.3398-2.1211 0.16016c-0.51172 0.03906-1-0.17969-1.3203-0.57812l-2.6484-3.4297-5.7617 11.262c-0.26172 0.51172-0.78125 0.82031-1.3516 0.82031z"/>
              <path fill="#fff" d="m87.478 64.616h-90.961c-0.55078 0-1.0586-0.30078-1.3281-0.78906-0.26953-0.48047-0.25-1.0781 0.050782-1.5391l45.477-71.629c0.55078-0.87891 2.0117-0.87891 2.5586 0l45.48 71.621c0.30078 0.46875 0.32031 1.0586 0.05078 1.5391-0.26953 0.48828-0.76953 0.78906-1.3281 0.78906zm-88.199-3.0391h85.441l-42.723-67.281z"/>
            </svg>`,
        className: 'svg-icon--mountain',
        iconSize: [20, 20]
      });

      const marker = L.marker([middleLat, middleLng], {
        icon: starIcon
      }).addTo(this.map!);

      marker.on('click', () => {
        this.onSegmentClick(segment);
      });
    });
  }

  onSegmentClick(segment: SegmentEffort) {
    // Utiliser la topologie embarquée dans le segment
    if (!segment.topology) {
      console.warn('Segment sans topologie:', segment);
      return;
    }
    
    const segmentAltitudes = segment.topology.altitudes;
    const segmentDistances = segment.topology.distances;
      
    console.info('Segment clicked:', segment.name);
    console.info('Segment altitudes:', segmentAltitudes);
    console.info('Segment distances:', segmentDistances);
    
    // Convertir les distances en km
    const distancesKm = segmentDistances.map(d => d / 1000);
    
    // Émettre l'événement vers le parent
    this.segmentSelected.emit({
      segment,
      topology: {
        distances: distancesKm,
        altitudes: segmentAltitudes
      }
    });
  }
}
