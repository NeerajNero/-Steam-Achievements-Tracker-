import { ResponseError } from '@steam-achievement/client-sdk';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  getAchievementTargetCreateErrorMessage,
  isAchievementTargetDisabled,
  TargetButton,
} from './target-button';

describe('TargetButton', () => {
  it('renders an unauthenticated target prompt', () => {
    const html = renderToStaticMarkup(
      <TargetButton
        isAuthenticated={false}
        isTargeted={false}
        onAdd={() => undefined}
        signInUrl="/auth/steam/login?returnTo=%2Faccount%2Ftargets"
      />,
    );

    expect(html).toContain('Sign in to target');
    expect(html).toContain('/auth/steam/login?returnTo=%2Faccount%2Ftargets');
  });

  it('renders targeted state', () => {
    const html = renderToStaticMarkup(
      <TargetButton
        isAuthenticated
        isTargeted
        onAdd={() => undefined}
        signInUrl="/auth/steam/login"
      />,
    );

    expect(html).toContain('Targeted');
    expect(html).toContain('/account/targets');
  });

  it('renders add state', () => {
    const onAdd = vi.fn();
    const html = renderToStaticMarkup(
      <TargetButton
        isAuthenticated
        isTargeted={false}
        onAdd={onAdd}
        signInUrl="/auth/steam/login"
      />,
    );

    expect(html).toContain('Add Target');
  });

  it('renders disabled state for already unlocked achievements', () => {
    const html = renderToStaticMarkup(
      <TargetButton
        disabledLabel="Already unlocked"
        isAuthenticated
        isDisabled
        isTargeted={false}
        onAdd={() => undefined}
        signInUrl="/auth/steam/login"
      />,
    );

    expect(html).toContain('Already unlocked');
    expect(html).toContain('disabled=""');
  });

  it('disables only already unlocked achievement target actions', () => {
    expect(isAchievementTargetDisabled('unlocked')).toBe(true);
    expect(isAchievementTargetDisabled('locked')).toBe(false);
    expect(isAchievementTargetDisabled('unknown')).toBe(false);
    expect(isAchievementTargetDisabled(undefined)).toBe(false);
  });

  it('maps achievement target conflicts to a friendly message', () => {
    const error = new ResponseError(new Response(null, { status: 409 }));

    expect(getAchievementTargetCreateErrorMessage(error)).toBe(
      'Already unlocked on your profile.',
    );
  });
});
