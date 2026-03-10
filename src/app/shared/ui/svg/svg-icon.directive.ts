import {Directive, effect, ElementRef, inject, input, OnInit, PLATFORM_ID, Renderer2} from '@angular/core';
import {SvgIcon} from './svg.type';
import {isPlatformBrowser} from '@angular/common';
import {SVG_ICONS} from './svg-icon-constants';

const ICON_NODE_CACHE = new Map<SvgIcon, SVGElement>()

@Directive({
  selector: '[appSvgIcon]',
  standalone: true,
})

export class SvgIconDirective implements OnInit {
  iconName = input.required<SvgIcon>()
  width = input<string | number>('24')
  height = input<string | number>('24')
  color = input<string | undefined>(undefined)
  ariaLabel = input<string | undefined>(undefined)
  iconClass = input<string>('')

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => this.render())
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
  }

  private render(): void {
    const name = this.iconName()
    const svgStr = SVG_ICONS[name]
    if (!svgStr) {
      this.renderer.setProperty(this.host.nativeElement, 'innerHTML', '')
      console.error(`[SvgIcon] Icône inconnue: ${name}`)
      return
    }

    let tpl = ICON_NODE_CACHE.get(name)
    if (!tpl) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(svgStr, 'image/svg+xml')
      tpl = doc.documentElement as unknown as SVGElement
      ICON_NODE_CACHE.set(name, tpl)
    }

    const svg = tpl.cloneNode(true) as SVGElement

    const color = this.color()
    if (color) {
      this.renderer.setStyle(this.host.nativeElement, 'color', color)
    } else {
      this.renderer.removeStyle(this.host.nativeElement, 'color')
    }

    svg.setAttribute('role', 'img');
    if (this.ariaLabel()) {
      svg.setAttribute('aria-label', this.ariaLabel()!)
      svg.removeAttribute('aria-hidden');
    } else {
      svg.setAttribute('aria-hidden', 'true');
    }

    if (this.iconClass()) {
      this.iconClass().split(' ').forEach(c => c && this.renderer.addClass(svg, c));
    }

    // Dimensions
    const toCssSize = (v: string | number) =>
      typeof v === 'number' ? `${v}px` : v;

    svg.setAttribute('width', toCssSize(this.width()))
    svg.setAttribute('height', toCssSize(this.height()))

    this.renderer.setProperty(this.host.nativeElement, 'innerHTML', '')
    this.renderer.appendChild(this.host.nativeElement, svg)
  }
}
