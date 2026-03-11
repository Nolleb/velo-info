import { Component, computed, inject, input, OnInit, OnDestroy, Signal, signal, viewChild, ElementRef, effect } from "@angular/core";
import { ActivityStore } from "./store/activity.store";
import { JsonPipe } from "@angular/common";
import { SafeDatePipe } from "../../shared/pipes/safe-date.pipe";
import { GlobalResultComponent } from "../../shared/components/global-result/global-result.component";
import { minutesToTimeString } from "../../shared/utils/time.utils";
import { ResultCriterionBlock } from "../../models/result-criterion.model";
import { SpeedPipe } from "../../shared/pipes/convertSpeed";
import { MinutesToTimePipe } from "../../shared/pipes/minutes-to-time.pipe";
import { CycleLoaderComponent } from "../../shared/components/cycle-loader/cycle-loader.component";
import { ActivityMapDetailComponent } from "../../shared/components/activity-map-detail/activity-map-detail.component";
import { SegmentEffort } from "../../models/strava.model";
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { KmPipe } from "../../shared/pipes/toKilometre";

// Enregistrer Chart.js
Chart.register(...registerables);

@Component({
  selector: "app-activity-page",
  templateUrl: "./activity-page.component.html",
  styleUrls: ["./activity-page.component.scss"],
  imports: [JsonPipe, SafeDatePipe, GlobalResultComponent, SpeedPipe, MinutesToTimePipe, CycleLoaderComponent, ActivityMapDetailComponent, SidebarComponent, KmPipe]
})

export class ActivityPageComponent implements OnInit, OnDestroy {
  activityStore = inject(ActivityStore);
  id = input<string>();
  
  // Gestion du segment sélectionné
  selectedSegmentData = signal<{
    segment: SegmentEffort;
    topology: { distances: number[]; altitudes: number[] };
  } | null>(null);
  
  topologyChart = viewChild<ElementRef<HTMLCanvasElement>>('topologyChart');
  private chart: Chart | null = null;
  sidebarOpen = signal(false);
  constructor() {
    // Effect pour créer le chart quand le canvas est disponible
    effect(() => {
      const canvas = this.topologyChart();
      const data = this.selectedSegmentData();
      
      if (canvas && data) {
        // Attendre le prochain cycle pour que le DOM soit mis à jour
        setTimeout(() => {
          this.createTopologyChart(data.topology.distances, data.topology.altitudes);
        }, 0);
      }
    });
  }

  mainActivity: Signal<ResultCriterionBlock> = computed(() => ({
    rows: [
      // Ligne 1 : Distance, Dénivelé, Temps
      [
        {
          label: 'Distance',
          value: (this.activityStore.activity()?.distance.toFixed(2).toString() + ' kms'),
          icon: {
            name: 'distance',
            width: '100%',
            height: '25px',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Dénivelé',
          value: (this.activityStore.activity()?.total_elevation_gain.toFixed(2).toString() + ' m'),
          icon: {
            name: 'elevation',
            width: '100%',
            height: '22px',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Temps',
          value: minutesToTimeString(this.activityStore.activity()?.moving_time || 0),
          icon: {
            name: 'chrono',
            width: '100%',
            height: '30px',
            color: 'var(--grey-semi-light-color)',
          },
        },
      ],
      [
        {
          label: 'Exploration',
          value: '23%',
          icon: {
            name: 'earth',
            width: '100%',
            height: '30px',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Intensité',
          value: '67%',
          icon: {
            name: 'energy',
            width: '100%',
            height: '30px',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Fatigue',
          value: '90%',
          icon: {
            name: 'fatigue',
            width: '100%',
            height: '25px',
            color: 'var(--grey-semi-light-color)',
          },
        },
      ],
      [
        {
          label: 'Puissance estimée',
          value: this.activityStore.activity()?.average_watts ? this.activityStore.activity()?.average_watts + ' W' : 'N/A',
          icon: {
            name: 'power',
            width: '100%',
            height: '30px',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Energie dépensée',
          value: this.activityStore.activity()?.kilojoules ? this.activityStore.activity()?.kilojoules + ' kJ' : 'N/A',
          icon: {
            name: 'calorie',
            width: '100%',
            height: '30px',
            color: 'var(--grey-semi-light-color)',
          },
        }
      ]
    ]
  }));

  ngOnInit(): void {
    const activityID = this.id() ? parseInt(this.id()!) : null;
    if (activityID) {
      this.activityStore.setActivityID(activityID);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  onSegmentSelected(data: { segment: SegmentEffort; topology: { distances: number[]; altitudes: number[] } }) {
    this.selectedSegmentData.set(data);
    this.sidebarOpen.set(true)
    // L'effect se chargera de créer le chart
  }

  private createTopologyChart(distances: number[], altitudes: number[]) {
    const canvas = this.topologyChart()?.nativeElement;
    if (!canvas) return;
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Calculer les pentes pour chaque point
    const slopes: (number | null)[] = [null]; // Premier point n'a pas de pente
    for (let i = 1; i < distances.length; i++) {
      const distanceDiff = (distances[i] - distances[i - 1]) * 1000; // Conversion en mètres
      const altitudeDiff = altitudes[i] - altitudes[i - 1];
      if (distanceDiff > 0) {
        const slope = (altitudeDiff / distanceDiff) * 100;
        slopes.push(slope);
      } else {
        slopes.push(null);
      }
    }
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: distances.map(d => d.toFixed(2)),
        datasets: [{
          label: 'Altitude (m)',
          data: altitudes,
          borderColor: '#E76D46',
          backgroundColor: 'rgba(231, 109, 70, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: {
            left: 0,
            right: 10
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            displayColors: false,
            callbacks: {
              title: (context) => `Distance: ${context[0].label} km`,
              label: (context) => {
                const altitude = context.parsed.y;
                const index = context.dataIndex;
                const slope = slopes[index];
                const lines: string[] = [];
                lines.push(`Altitude: ${altitude?.toFixed(0)} m`);
                if (slope !== null) {
                  lines.push(`Pente: ${slope >= 0 ? '+' : ''}${slope.toFixed(1)}%`);
                }
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: false,
              text: 'Distance (km)'
            },
            ticks: {
              maxTicksLimit: 8
            }
          },
          y: {
            position: 'top',
            title: {
              display: false,
              text: 'Altitude (m)',
            },
            beginAtZero: false
          }
        }
      }
    };
    
    this.chart = new Chart(canvas, config);
  }
}