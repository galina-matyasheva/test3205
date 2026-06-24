import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import UrlItem from '../../components/UrlItem';
import type { UrlCheck } from '../../types';

const baseUrlCheck: UrlCheck = {
  url: 'https://example.com',
  status: 'pending',
};

describe('UrlItem', () => {
  it('renders url and index', () => {
    render(
      <UrlItem
        urlCheck={baseUrlCheck}
        index={0}
        showCancel={false}
        cancelling={false}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('shows cancel button for pending when showCancel is true', () => {
    render(
      <UrlItem
        urlCheck={baseUrlCheck}
        index={0}
        showCancel
        cancelling={false}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
  });

  it('hides cancel button when showCancel is false', () => {
    render(
      <UrlItem
        urlCheck={baseUrlCheck}
        index={0}
        showCancel={false}
        cancelling={false}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: /Cancel/ })).not.toBeInTheDocument();
  });

  it('shows status badge for non-pending URLs when showCancel is true', () => {
    render(
      <UrlItem
        urlCheck={{ url: 'https://example.com', status: 'success' }}
        index={0}
        showCancel
        cancelling={false}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('disables cancel button when cancelling', () => {
    render(
      <UrlItem
        urlCheck={baseUrlCheck}
        index={0}
        showCancel
        cancelling
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeDisabled();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <UrlItem
        urlCheck={baseUrlCheck}
        index={0}
        showCancel
        cancelling={false}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows http status and duration when available', () => {
    render(
      <UrlItem
        urlCheck={{
          url: 'https://example.com',
          status: 'success',
          httpStatus: 200,
          duration: 1500,
        }}
        index={0}
        showCancel={false}
        cancelling={false}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/HTTP 200/)).toBeInTheDocument();
    expect(screen.getByText(/1\.50s/)).toBeInTheDocument();
  });

  it('shows cancel error message', () => {
    render(
      <UrlItem
        urlCheck={baseUrlCheck}
        index={0}
        showCancel
        cancelling={false}
        cancelError="Already completed"
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/Already completed/)).toBeInTheDocument();
  });

  it('shows url error', () => {
    render(
      <UrlItem
        urlCheck={{ url: 'https://example.com', status: 'error', error: 'Timeout' }}
        index={0}
        showCancel={false}
        cancelling={false}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/Timeout/)).toBeInTheDocument();
  });
});
