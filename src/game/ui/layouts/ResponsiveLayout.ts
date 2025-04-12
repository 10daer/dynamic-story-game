// src/core/ui/layout/ResponsiveLayout.ts
import * as PIXI from 'pixi.js';
import { EventEmitter } from '../../../core/events/EventEmitter';
import { Game } from '../../../game/Game';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface LayoutElement {
  container: PIXI.Container;
  layout: {
    [key in Breakpoint]?: {
      x?: number | string; // number or percentage (e.g., '50%')
      y?: number | string;
      width?: number | string;
      height?: number | string;
      scale?: number;
      visible?: boolean;
    };
  };
}

export class ResponsiveLayout extends EventEmitter {
  private game: Game;
  private elements: Map<string, LayoutElement> = new Map();
  private breakpoints: BreakpointConfig;
  private currentBreakpoint: Breakpoint = 'md';
  private screenWidth: number;
  private screenHeight: number;

  constructor(game: Game, breakpoints?: Partial<BreakpointConfig>) {
    super();
    this.game = game;

    this.breakpoints = {
      xs: 480,
      sm: 768,
      md: 1024,
      lg: 1440,
      xl: 1920,
      ...breakpoints
    };

    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;

    // Update current breakpoint
    this.updateBreakpoint();

    // Listen for resize events
    window.addEventListener('resize', this.onResize.bind(this));

    // Listen for game resize events
    this.game.on('game:resize', this.onGameResize.bind(this));
  }

  private onResize(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.updateBreakpoint();
    this.updateLayout();
  }

  private onGameResize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.updateBreakpoint();
    this.updateLayout();
  }

  private updateBreakpoint(): boolean {
    const width = this.screenWidth;

    let newBreakpoint: Breakpoint = 'xs';

    if (width >= this.breakpoints.xl) {
      newBreakpoint = 'xl';
    } else if (width >= this.breakpoints.lg) {
      newBreakpoint = 'lg';
    } else if (width >= this.breakpoints.md) {
      newBreakpoint = 'md';
    } else if (width >= this.breakpoints.sm) {
      newBreakpoint = 'sm';
    }

    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      this.emit('breakpoint:change', newBreakpoint, oldBreakpoint);
      return true;
    }

    return false;
  }

  public getCurrentBreakpoint(): Breakpoint {
    return this.currentBreakpoint;
  }

  public addElement(id: string, element: LayoutElement): void {
    this.elements.set(id, element);
    this.updateElementLayout(element);
  }

  public removeElement(id: string): boolean {
    return this.elements.delete(id);
  }

  public getElement(id: string): LayoutElement | undefined {
    return this.elements.get(id);
  }

  public updateLayout(): void {
    for (const element of this.elements.values()) {
      this.updateElementLayout(element);
    }
    this.emit('layout:update');
  }

  private updateElementLayout(element: LayoutElement): void {
    // Find best matching breakpoint for this element
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const breakpointIndex = breakpoints.indexOf(this.currentBreakpoint);

    // Try to find layout config for current breakpoint or lower
    let layoutConfig = null;
    for (let i = breakpointIndex; i >= 0; i--) {
      const bp = breakpoints[i];
      if (element.layout[bp]) {
        layoutConfig = element.layout[bp];
        break;
      }
    }

    // If no config found, use xs as fallback or return
    if (!layoutConfig) {
      if (element.layout.xs) {
        layoutConfig = element.layout.xs;
      } else {
        return;
      }
    }

    // Apply layout properties
    const { container } = element;

    // Position X
    if (layoutConfig.x !== undefined) {
      if (typeof layoutConfig.x === 'string' && layoutConfig.x.endsWith('%')) {
        const percentage = parseFloat(layoutConfig.x) / 100;
        container.position.x = this.screenWidth * percentage;
      } else {
        container.position.x = layoutConfig.x as number;
      }
    }

    // Position Y
    if (layoutConfig.y !== undefined) {
      if (typeof layoutConfig.y === 'string' && layoutConfig.y.endsWith('%')) {
        const percentage = parseFloat(layoutConfig.y) / 100;
        container.position.y = this.screenHeight * percentage;
      } else {
        container.position.y = layoutConfig.y as number;
      }
    }

    // Width
    if (layoutConfig.width !== undefined) {
      if (typeof layoutConfig.width === 'string' && layoutConfig.width.endsWith('%')) {
        const percentage = parseFloat(layoutConfig.width) / 100;
        // Apply width if container has a method to set width
        if ('width' in container) {
          (container as any).width = this.screenWidth * percentage;
        }
      } else if (typeof layoutConfig.width === 'number') {
        if ('width' in container) {
          (container as any).width = layoutConfig.width;
        }
      }
    }

    // Height
    if (layoutConfig.height !== undefined) {
      if (typeof layoutConfig.height === 'string' && layoutConfig.height.endsWith('%')) {
        const percentage = parseFloat(layoutConfig.height) / 100;
        // Apply height if container has a method to set height
        if ('height' in container) {
          (container as any).height = this.screenHeight * percentage;
        }
      } else if (typeof layoutConfig.height === 'number') {
        if ('height' in container) {
          (container as any).height = layoutConfig.height;
        }
      }
    }

    // Scale
    if (layoutConfig.scale !== undefined) {
      container.scale.set(layoutConfig.scale);
    }

    // Visibility
    if (layoutConfig.visible !== undefined) {
      container.visible = layoutConfig.visible;
    }
  }

  public destroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.game.off('game:resize', this.onGameResize.bind(this));
    this.elements.clear();
    this.clear();
  }
}
