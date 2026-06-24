import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import UrlList from '../../components/UrlList';
import type { UrlCheck } from '../../types';

const urls: UrlCheck[] = [
  { url: 'https://a.com', status: 'pending' },
  { url: 'https://b.com', status: 'success' },
];

describe('UrlList', () => {
  it('renders all URLs', () => {
    render(
      <UrlList urls={urls} cancellingUrls={[]} urlErrors={{}} onCancelUrl={() => {}} />,
    );
    expect(screen.getByText('https://a.com')).toBeInTheDocument();
    expect(screen.getByText('https://b.com')).toBeInTheDocument();
  });

  it('shows total count', () => {
    render(
      <UrlList urls={urls} cancellingUrls={[]} urlErrors={{}} onCancelUrl={() => {}} />,
    );
    expect(screen.getByText(/2 total/i)).toBeInTheDocument();
  });

  it('calls onCancelUrl when cancel clicked', async () => {
    const onCancelUrl = vi.fn();
    const user = userEvent.setup();
    render(
      <UrlList
        urls={[
          { url: 'https://a.com', status: 'pending' },
          { url: 'https://b.com', status: 'success' },
        ]}
        cancellingUrls={[]}
        urlErrors={{}}
        onCancelUrl={onCancelUrl}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(onCancelUrl).toHaveBeenCalledWith('https://a.com');
  });

  it('renders single URL without cancel button', () => {
    render(
      <UrlList
        urls={[{ url: 'https://a.com', status: 'pending' }]}
        cancellingUrls={[]}
        urlErrors={{}}
        onCancelUrl={() => {}}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('passes cancelError to UrlItem', () => {
    render(
      <UrlList
        urls={[{ url: 'https://a.com', status: 'pending' }]}
        cancellingUrls={['https://a.com']}
        urlErrors={{ 'https://a.com': 'Failed' }}
        onCancelUrl={() => {}}
      />,
    );
    expect(screen.getByText(/Failed/)).toBeInTheDocument();
  });
});
