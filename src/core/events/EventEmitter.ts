export type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Function to call when event is emitted
   * @returns Unsubscribe function
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to an event once
   * @param event Event name
   * @param callback Function to call when event is emitted
   */
  once(event: string, callback: EventCallback): void {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });

    // const onceCallback = (...args: any[]) => {
    //   this.off(event, onceCallback);
    //   callback(...args);
    // };

    // this.on(event, onceCallback);
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to callbacks
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;

    callbacks.forEach((callback) => callback(...args));
  }

  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  off(event: string, callback?: EventCallback): void {
    if (!this.events.has(event)) return;

    if (!callback) {
      this.events.delete(event);
      return;
    }

    const callbacks = this.events.get(event)!;
    const index = callbacks.indexOf(callback);

    if (index !== -1) {
      callbacks.splice(index, 1);

      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Remove all event listeners
   */
  clear(): void {
    this.events.clear();
  }
}

// Create a singleton instance for global events
export const globalEvents = new EventEmitter();
