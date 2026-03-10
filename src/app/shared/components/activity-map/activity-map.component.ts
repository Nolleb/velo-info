import { Component, input, AfterViewInit, effect, OnDestroy } from "@angular/core";
import { decode } from '@googlemaps/polyline-codec';
import * as L from 'leaflet';

@Component({
  selector: "app-activity-map",
  templateUrl: "./activity-map.component.html",
  styleUrls: ["./activity-map.component.scss"]  
})

export class ActivityMapComponent implements AfterViewInit, OnDestroy {

  polyline = input<string>();

  map: L.Map | null = null;
  mapId = `map-${Math.random().toString(36).substring(2, 11)}`;
  private mapInitialized = false;

  constructor() {
    // Réagir aux changements du polyline
    effect(() => {
      const polylineValue = this.polyline();
      if (polylineValue && this.mapInitialized) {
        this.initializeMap(polylineValue);
      }
    });
  }

  ngAfterViewInit() {
    this.mapInitialized = true;
    const polylineValue = this.polyline();
    if (polylineValue) {
      this.initializeMap(polylineValue);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initializeMap(polylineValue: string) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const points = decode(polylineValue);
    const tempPolyline = L.polyline(points);
    const bounds = tempPolyline.getBounds();
    
    this.map = L.map(this.mapId).fitBounds(bounds);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 5,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.loadMap(polylineValue);
  }

  loadMap(polyline: string) {
    if (!this.map) return;
    
    const points = decode(polyline);

    // Créer l'effet glow avec une polyline large et floue
    L.polyline(points, {
      color: 'red',
      weight: 4,
      opacity: 0.3,
    }).addTo(this.map);

    // Ajouter une deuxième couche pour le glow externe
    L.polyline(points, {
      color: 'red',
      weight: 8,
      opacity: 0.15,
    }).addTo(this.map);

    // La route principale par-dessus
    const route = L.polyline(points, {
      color: '#E76D46',
      weight: 2,
      opacity: 1
    }).addTo(this.map);

    this.map.fitBounds(route.getBounds());
    
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }
}
