import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PerformanceChartsDemo from '../PerformanceChartsDemo';

// Mock hooks used by the page
jest.mock('../../hooks/usePropFinderData', () => {
  return jest.fn(() => ({ performance: [], loading: false }));
});

jest.mock('../../hooks/useRealtimeMock', () => {
  return jest.fn(() => [
    { date: new Date().toISOString(), actual: 20, line: 18, opponent: 'NYK' },
    { date: new Date(Date.now() - 86400000).toISOString(), actual: 18, line: 19, opponent: 'BOS' },
  ]);
});

describe('PerformanceChartsDemo (smoke + interactions)', () => {
  it('renders and responds to smoothing controls and export', async () => {
    render(<PerformanceChartsDemo />);

    // Check static header
    expect(await screen.findByText(/Performance Comparison Charts/i)).toBeInTheDocument();

    // Smoothing checkbox should exist
    const smoothingCheckbox = screen.getByLabelText(/Smoothing \(moving avg\)/i) as HTMLInputElement;
    expect(smoothingCheckbox).toBeInTheDocument();
    expect(smoothingCheckbox.checked).toBe(false);

    // Toggle smoothing on
    fireEvent.click(smoothingCheckbox);
    await waitFor(() => expect(smoothingCheckbox.checked).toBe(true));

    // Change window input
    const windowInput = screen.getByLabelText(/Window:/i) as HTMLInputElement;
    expect(windowInput).toBeInTheDocument();
    fireEvent.change(windowInput, { target: { value: '5' } });
    expect(windowInput.value).toBe('5');

    // Change method select
    const methodSelect = screen.getByLabelText(/Method:/i) as HTMLSelectElement;
    expect(methodSelect).toBeInTheDocument();
    fireEvent.change(methodSelect, { target: { value: 'ema' } });
    expect(methodSelect.value).toBe('ema');

    // Spy on the download anchor creation flow via URL.createObjectURL
    const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL');
    // Click Export CSV button
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    expect(exportBtn).toBeInTheDocument();
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    createObjectURLSpy.mockRestore();
  });
});
