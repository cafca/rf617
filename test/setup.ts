import { beforeAll, afterEach } from 'vitest';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  document.getElementsByTagName('body')[0].innerHTML = '';
});
