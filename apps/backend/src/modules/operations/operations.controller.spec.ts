import { describe, expect, it } from 'vitest';

import { OperationsController } from './operations.controller';

describe('OperationsController', () => {
  it('renders a local home page with docs and queue dashboard links', () => {
    const controller = new OperationsController();

    expect(controller.getHome()).toEqual(expect.stringContaining('href="/docs"'));
    expect(controller.getHome()).toEqual(
      expect.stringContaining('href="/queues"'),
    );
  });

  it('keeps the legacy dashboard path as a queue UI redirect', () => {
    const controller = new OperationsController();

    expect(controller.getBullDashboardRedirect()).toEqual({ url: '/queues' });
  });
});
