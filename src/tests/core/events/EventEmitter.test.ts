import { EventEmitter } from '../../../core/events/EventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test('should register and trigger events', () => {
    const mockCallback = jest.fn();
    emitter.on('test', mockCallback);

    emitter.emit('test', 'arg1', 'arg2');

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  test('should allow unsubscribing from events', () => {
    const mockCallback = jest.fn();
    const unsubscribe = emitter.on('test', mockCallback);

    emitter.emit('test');
    expect(mockCallback).toHaveBeenCalledTimes(1);

    unsubscribe();
    emitter.emit('test');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should handle once events', () => {
    const mockCallback = jest.fn();
    emitter.once('test', mockCallback);

    emitter.emit('test');
    emitter.emit('test');

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should clear all events', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    emitter.on('test1', mockCallback1);
    emitter.on('test2', mockCallback2);

    emitter.clear();

    emitter.emit('test1');
    emitter.emit('test2');

    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).not.toHaveBeenCalled();
  });
});
