import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StateView from '../../components/common/StateView';

describe('StateView', () => {
  const title = 'Job Details';

  it('renders loading state', () => {
    render(<StateView variant="loading" rootClass="test" title={title} message="Loading..." />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state with message in <p>', () => {
    render(<StateView variant="empty" rootClass="test" title={title} message="No data" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('No data').tagName).toBe('P');
  });

  it('renders error state', () => {
    render(<StateView variant="error" rootClass="test" title={title} message="Error occurred" />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('uses rootClass for element className', () => {
    const { container } = render(
      <StateView variant="loading" rootClass="my-component" title={title} />,
    );
    expect(container.querySelector('.my-component')).toBeInTheDocument();
    expect(container.querySelector('.my-component__loading')).toBeInTheDocument();
  });
});
