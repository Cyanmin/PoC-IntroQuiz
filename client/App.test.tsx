import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('App', () => {
  it('renders greeting', () => {
    render(<App />);
    expect(screen.getByText('Hello Quiz!')).toBeInTheDocument();
  });
});
