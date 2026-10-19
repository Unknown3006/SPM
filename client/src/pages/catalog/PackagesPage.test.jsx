import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PackagesPage from './PackagesPage';
import api from '../../api/axios';

// Mock the Axios instance
vi.mock('../../api/axios');

describe('PackagesPage Catalog & Search Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPackagesData = {
    data: {
      success: true,
      count: 2,
      total: 2,
      totalPages: 1,
      currentPage: 1,
      packages: [
        {
          _id: 'pkg-1',
          title: 'Goa Beach Leisure Escape',
          destination: 'Goa',
          description: 'Relax on beautiful beaches of Goa.',
          durationDays: 5,
          price: 15499,
          category: 'beach',
          images: ['https://images.unsplash.com/photo-goa'],
          availableDates: [{ date: '2026-12-01T00:00:00.000Z', seatsLeft: 10 }],
          ratingAverage: 4.8,
          ratingCount: 30
        },
        {
          _id: 'pkg-2',
          title: 'Himalayan High Passes Trek',
          destination: 'Leh Ladakh',
          description: 'Trek through Rohtang and Pangong Lake.',
          durationDays: 7,
          price: 24999,
          category: 'adventure',
          images: ['https://images.unsplash.com/photo-ladakh'],
          availableDates: [{ date: '2026-12-10T00:00:00.000Z', seatsLeft: 6 }],
          ratingAverage: 4.9,
          ratingCount: 25
        }
      ]
    }
  };

  it('renders holiday tour packages correctly with destination and prices', async () => {
    api.get.mockResolvedValueOnce(mockPackagesData);

    render(
      <BrowserRouter>
        <PackagesPage />
      </BrowserRouter>
    );

    // Verify packages appear in the DOM
    await waitFor(() => {
      expect(screen.getByText(/Goa Beach Leisure Escape/i)).toBeInTheDocument();
      expect(screen.getByText(/Himalayan High Passes Trek/i)).toBeInTheDocument();
      expect(screen.getByText(/₹15,499/i)).toBeInTheDocument();
      expect(screen.getByText(/₹24,999/i)).toBeInTheDocument();
    });
  });

  it('renders "No Results Found" component when search returns zero packages', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        count: 0,
        total: 0,
        totalPages: 1,
        currentPage: 1,
        packages: []
      }
    });

    render(
      <BrowserRouter>
        <PackagesPage />
      </BrowserRouter>
    );

    // Verify empty state is rendered
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /No Results Found/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear All Filters/i })).toBeInTheDocument();
    });
  });

  it('filters by category when clicking category button', async () => {
    api.get.mockResolvedValue(mockPackagesData);

    render(
      <BrowserRouter>
        <PackagesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Goa Beach Leisure Escape/i)).toBeInTheDocument();
    });

    const adventureFilterBtn = screen.getByRole('button', { name: /Adventure/i });
    fireEvent.click(adventureFilterBtn);

    expect(api.get).toHaveBeenCalledWith('/packages', expect.objectContaining({
      params: expect.objectContaining({ category: 'adventure' })
    }));
  });
});
