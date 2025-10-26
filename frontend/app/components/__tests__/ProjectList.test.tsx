import { render, screen, waitFor, fireEvent, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectList from '../ProjectList';
import * as api from '../../lib/api';
import { Project } from '../../types/project';

// Mock only the API functions, not the ApiError class
jest.mock('../../lib/api', () => {
  const actualApi = jest.requireActual('../../lib/api');
  return {
    ...actualApi,
    getProjects: jest.fn(),
    deleteProject: jest.fn(),
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

describe('ProjectList', () => {
  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Test Project 1',
      description: 'This is a test project description',
      status: 'planned',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: 2,
      name: 'Test Project 2',
      description: 'Another test project',
      status: 'in_progress',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
    {
      id: 3,
      name: 'Test Project 3',
      description: null,
      status: 'completed',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
  ];

  beforeEach(() => {
    // Reset implementations before each test to ensure clean slate
    mockedApi.getProjects.mockReset();
    mockedApi.deleteProject.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Loading State', () => {
    it('displays loading skeleton while fetching projects', () => {
      mockedApi.getProjects.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectList />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading projects')).toBeInTheDocument();
      expect(screen.getByText('Loading projects...', { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('displays skeleton cards during loading', () => {
      mockedApi.getProjects.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectList />);

      const skeletons = screen.getByRole('status').querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to connect to the API';
      mockedApi.getProjects.mockRejectedValueOnce(
        new api.ApiError(errorMessage, 500)
      );

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('displays retry button on error', async () => {
      mockedApi.getProjects.mockRejectedValueOnce(
        new api.ApiError('Network error', 0)
      );

      render(<ProjectList />);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('retries fetching projects when retry button is clicked', async () => {
      mockedApi.getProjects
        .mockRejectedValueOnce(new api.ApiError('Network error', 0))
        .mockResolvedValueOnce(mockProjects);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      expect(mockedApi.getProjects).toHaveBeenCalledTimes(2);
    });

    it('displays generic error message for non-ApiError', async () => {
      mockedApi.getProjects.mockRejectedValueOnce(new Error('Unknown error'));

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load projects. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no projects exist', async () => {
      mockedApi.getProjects.mockResolvedValueOnce([]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('No projects yet')).toBeInTheDocument();
        expect(screen.getByText(/Create your first project/i)).toBeInTheDocument();
      });
    });

    it('displays empty state with proper semantic structure', async () => {
      mockedApi.getProjects.mockResolvedValueOnce([]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'No projects yet' })).toBeInTheDocument();
      });
    });
  });

  describe('Project Display', () => {
    it('displays all projects from API', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
        expect(screen.getByText('Test Project 3')).toBeInTheDocument();
      });
    });

    it('displays project descriptions', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('This is a test project description')).toBeInTheDocument();
        expect(screen.getByText('Another test project')).toBeInTheDocument();
      });
    });

    it('does not display description when null', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        const projectCard = screen.getByText('Test Project 3').closest('div[role="listitem"]') as HTMLElement;
        expect(projectCard).toBeInTheDocument();
        const descriptions = within(projectCard).queryByText(/description/i);
        expect(descriptions).not.toBeInTheDocument();
      });
    });

    it('displays status badges with correct labels', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Planned')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('displays relative time for created and updated dates', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
        expect(screen.getByText(/yesterday/i)).toBeInTheDocument();
      });
    });

    it('truncates long descriptions', async () => {
      const longDescription = 'a'.repeat(150);
      const projectWithLongDesc: Project = {
        ...mockProjects[0],
        description: longDescription,
      };
      mockedApi.getProjects.mockResolvedValueOnce([projectWithLongDesc]);

      render(<ProjectList />);

      await waitFor(() => {
        const displayedText = screen.getByText(/aaa/);
        expect(displayedText.textContent).toHaveLength(103); // 100 chars + '...'
        expect(displayedText.textContent).toContain('...');
      });
    });

    it('renders projects in a grid layout', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        const grid = screen.getByRole('list', { name: 'Projects' });
        expect(grid).toHaveClass('grid');
        expect(grid).toHaveClass('grid-cols-1');
        expect(grid).toHaveClass('md:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-3');
      });
    });
  });

  describe('Project Selection', () => {
    it('calls onProjectSelect when select button is clicked', async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const selectButton = screen.getAllByRole('button', { name: /select project/i })[0];
      fireEvent.click(selectButton);

      expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('highlights selected project', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList selectedProjectId={1} />);

      await waitFor(() => {
        const selectedCard = screen.getByText('Test Project 1').closest('div[role="listitem"]');
        expect(selectedCard).toHaveClass('border-blue-500');
      });
    });

    it('shows "Selected" text for selected project', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList selectedProjectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /select project test project 1/i }))
          .toHaveTextContent('Selected');
      });
    });

    it('supports keyboard navigation for selection', async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const selectButton = screen.getAllByRole('button', { name: /select project/i })[0];
      fireEvent.keyDown(selectButton, { key: 'Enter' });

      expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('supports space key for selection', async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const selectButton = screen.getAllByRole('button', { name: /select project/i })[0];
      fireEvent.keyDown(selectButton, { key: ' ' });

      expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('does not trigger selection on other keys', async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const selectButton = screen.getAllByRole('button', { name: /select project/i })[0];
      fireEvent.keyDown(selectButton, { key: 'a' });

      expect(onProjectSelect).not.toHaveBeenCalled();
    });
  });

  describe('Project Deletion', () => {
    it('calls deleteProject API when delete button is clicked', async () => {
      mockedApi.deleteProject.mockResolvedValueOnce({ message: 'Deleted' });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /delete project/i })[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockedApi.deleteProject).toHaveBeenCalledWith(1);
      });
    });

    it('removes deleted project from list', async () => {
      mockedApi.deleteProject.mockResolvedValueOnce({ message: 'Deleted' });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete project test project 1/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
      });
    });

    it('calls onProjectDelete callback after successful deletion', async () => {
      const onProjectDelete = jest.fn();
      mockedApi.deleteProject.mockResolvedValueOnce({ message: 'Deleted' });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectDelete={onProjectDelete} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete project test project 1/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(onProjectDelete).toHaveBeenCalledWith(1);
      });
    });

    it('displays error message when deletion fails', async () => {
      const errorMessage = 'Failed to delete project';
      mockedApi.deleteProject.mockRejectedValueOnce(
        new api.ApiError(errorMessage, 500)
      );
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete project test project 1/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('displays generic error message for non-ApiError deletion', async () => {
      mockedApi.deleteProject.mockRejectedValueOnce(new Error('Unknown error'));
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete project test project 1/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete project. Please try again.')).toBeInTheDocument();
      });
    });

    it('disables project card during deletion', async () => {
      mockedApi.deleteProject.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete project test project 1/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const projectCard = screen.getByText('Test Project 1').closest('div[role="listitem"]');
        expect(projectCard).toHaveClass('opacity-50');
        expect(projectCard).toHaveClass('pointer-events-none');
      });
    });

    it('keeps other projects when one is deleted', async () => {
      mockedApi.deleteProject.mockResolvedValueOnce({ message: 'Deleted' });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete project test project 1/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
        expect(screen.getByText('Test Project 3')).toBeInTheDocument();
      });
    });
  });

  describe('Status Colors and Labels', () => {
    it('displays correct color for planned status', async () => {
      const project: Project = { ...mockProjects[0], status: 'planned' };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        const badge = screen.getByText('Planned');
        expect(badge).toHaveClass('bg-blue-100');
        expect(badge).toHaveClass('text-blue-800');
      });
    });

    it('displays correct color for in_progress status', async () => {
      const project: Project = { ...mockProjects[0], status: 'in_progress' };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        const badge = screen.getByText('In Progress');
        expect(badge).toHaveClass('bg-purple-100');
        expect(badge).toHaveClass('text-purple-800');
      });
    });

    it('displays correct color for completed status', async () => {
      const project: Project = { ...mockProjects[0], status: 'completed' };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        const badge = screen.getByText('Completed');
        expect(badge).toHaveClass('bg-green-100');
        expect(badge).toHaveClass('text-green-800');
      });
    });

    it('displays correct color for archived status', async () => {
      const project: Project = { ...mockProjects[0], status: 'archived' };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        const badge = screen.getByText('Archived');
        expect(badge).toHaveClass('bg-gray-100');
        expect(badge).toHaveClass('text-gray-800');
      });
    });

    it('falls back to planned style for unknown status', async () => {
      const project: Project = { ...mockProjects[0], status: 'unknown' };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        const badge = screen.getByText('Unknown Status');
        expect(badge).toHaveClass('bg-blue-100');
        expect(badge).toHaveClass('text-blue-800');
      });
    });

    it('displays "Unknown Status" label for unrecognized status', async () => {
      const project: Project = { ...mockProjects[0], status: 'custom_status' };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        const badge = screen.getByText('Unknown Status');
        expect(badge).toBeInTheDocument();
        // Should use planned color as fallback
        expect(badge).toHaveClass('bg-blue-100');
      });
    });
  });

  describe('Relative Time Formatting', () => {
    it('formats time as "just now" for very recent dates', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('just now').length).toBeGreaterThan(0);
      });
    });

    it('formats time as "1 minute ago" for singular minute', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
        updated_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('1 minute ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time in minutes for recent dates', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('5 minutes ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time in hours', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('3 hours ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time as "1 hour ago" for singular hour', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('1 hour ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time as "yesterday"', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('yesterday').length).toBeGreaterThan(0);
      });
    });

    it('formats time in weeks', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('2 weeks ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time as "1 week ago" for singular week', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('1 week ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time in months', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('2 months ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time as "1 month ago" for singular month', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('1 month ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time in years', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(), // 730 days ago (2 years)
        updated_at: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('2 years ago').length).toBeGreaterThan(0);
      });
    });

    it('formats time as "1 year ago" for singular year', async () => {
      const project: Project = {
        ...mockProjects[0],
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 365 days ago
        updated_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getAllByText('1 year ago').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for project actions', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Select project Test Project 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete project Test Project 1' })).toBeInTheDocument();
      });
    });

    it('has proper ARIA label for status badges', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        const badge = screen.getByText('Planned');
        expect(badge).toHaveAttribute('aria-label', 'Status: Planned');
      });
    });

    it('has semantic time elements', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        const timeElements = screen.getAllByRole('time');
        expect(timeElements.length).toBeGreaterThan(0);
        expect(timeElements[0]).toHaveAttribute('datetime');
      });
    });

    it('uses list semantic structure', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByRole('list', { name: 'Projects' })).toBeInTheDocument();
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
      });
    });

    it('has hidden decorative SVG icons', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      await waitFor(() => {
        const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
        expect(svgs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty description gracefully', async () => {
      const project: Project = { ...mockProjects[0], description: null };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });

    it('handles short description without truncation', async () => {
      const project: Project = { ...mockProjects[0], description: 'Short text' };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Short text')).toBeInTheDocument();
      });
    });

    it('handles missing callbacks gracefully', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      mockedApi.deleteProject.mockResolvedValueOnce({ message: 'Deleted' });

      render(<ProjectList />); // No callbacks provided

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const selectButton = screen.getAllByRole('button', { name: /select project/i })[0];
      fireEvent.click(selectButton);

      const deleteButtons = screen.getAllByRole('button', { name: /delete project/i });
      fireEvent.click(deleteButtons[0]);

      // Should not crash
      await waitFor(() => {
        expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
      });
    });

    it('handles API returning empty array', async () => {
      mockedApi.getProjects.mockResolvedValueOnce([]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('No projects yet')).toBeInTheDocument();
      });
    });

    it('shows error but keeps existing projects visible on delete error', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      mockedApi.deleteProject.mockRejectedValueOnce(
        new api.ApiError('Cannot delete', 400)
      );

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete project test project 1/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cannot delete')).toBeInTheDocument();
        // Project should still be visible
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });
  });
});
