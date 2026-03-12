import { AfterViewInit, Component, computed, effect, ElementRef, input, viewChild } from "@angular/core";
import { Chart, registerables } from "chart.js";

// Enregistrer Chart.js
Chart.register(...registerables);

@Component({
  selector: "app-progress-chart",
  standalone: true,
  templateUrl: "./progress-chart.component.html",
  styleUrls: ["./progress-chart.component.scss"]
})

export class ProgressChartComponent implements AfterViewInit {
  value = input<number | undefined>(0);
  objective = input<number>(0);

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  percentage = computed(() =>
    (this.value() ?? 0) / this.objective() * 100
  );

  displayPercentage = computed(() =>
    Math.min(this.percentage(), 100)
  );

  chart!: Chart;

  constructor(){
     effect(() => {
      if (!this.chart) return;
      
      const progress = this.displayPercentage();

      this.chart.data.datasets[0].data = [
        progress,
        100 - progress
      ];

      this.chart.update();
    });
  }

  ngAfterViewInit() {
    const canvasElement = this.canvas()?.nativeElement;
    if (!canvasElement) return;

    this.chart = new Chart(canvasElement, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [
              this.displayPercentage(),
              100 - this.displayPercentage()
            ],
            backgroundColor: ['#C4D489', '#E0E0E0'],
            borderWidth: 0
          }
        ]
      },
      options: {
        cutout: '70%',
        responsive: true,
        plugins: {
          tooltip: { enabled: false }
        }
      }
    });
  }
}