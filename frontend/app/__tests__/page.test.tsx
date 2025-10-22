/**
 * Unit tests for Home page component
 * Tests project list, loading states, error handling, and form integration
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Home from '../page'
import * as api from '../lib/api'
import { Project } from '../types/project'

// Mock the API module
jest.mock('../lib/api')

// Mock ProjectForm component
jest.mock('../components/ProjectForm', () => {
  return function MockProjectForm({ 
    onSuccess, 
    onCancel 
  }: { 
    onSuccess: () => void
    onCancel: () => void 
  }) {
    return (
      <div data-testid="project-form">
        <button onClick={onSuccess}>Submit Form</button>
        <button onClick={onCancel}>Cancel Form</button>
      </div>
    )
  }
})

describe('Home Page', () => {
  const mockProjects: Project[] = [
    {
      id: 1,
      title: 'Test Project 1',
      description: 'Test Description 1',
      status: 'planned',
      created_at: '2025-10-15T10:00:00Z',
      updated_at: '2025-10-15T10:00:00Z',
    },
    {
      id: 2,
      title: 'Test Project 2',
      description: null,
      status: 'in_progress',
      created_at: '2025-10-16T11:00:00Z',
      updated_at: '2025-10-16T11:00:00Z',
    },
    {
      id: 3,
      title: 'Test Project 3',
      description: 'Test Description 3',
      status: 'completed',
      created_at: '2025-10-17T12:00:00Z',
      updated_at: '2025-10-17T12:00:00Z',
    },
    {
      id: 4,
      title: 'Test Project 4',
      description: 'Test Description 4',
      status: 'archived',
      created_at: '2025-10-18T13:00:00Z',
      updated_at: '2025-10-18T13:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('should render page title and description', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      expect(screen.getByText('YouTube Assistant')).toBeInTheDocument()
      expect(screen.getByText(/Helper for planning and making YouTube videos/)).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      ;(api.checkHealth as jest.Mock).mockImplementation(() => new Promise(() => {}))
      ;(api.getProjects as jest.Mock).mockImplementation(() => new Promise(() => {}))

      const { container } = render(<Home />)

      expect(screen.getByText('Loading projects...')).toBeInTheDocument()
      // Check for spinner div by class
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should show API status as checking initially', () => {
      ;(api.checkHealth as jest.Mock).mockImplementation(() => new Promise(() => {}))
      ;(api.getProjects as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<Home />)

      expect(screen.getByText('checking...')).toBeInTheDocument()
    })
  })

  describe('API Health Check', () => {
    it('should display healthy status when API is healthy', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('healthy')).toBeInTheDocument()
      })
    })

    it('should display disconnected status when API check fails', async () => {
      ;(api.checkHealth as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(api.getProjects as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('disconnected')).toBeInTheDocument()
      })
    })

    it('should display unknown status when API returns no status', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({})
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('unknown')).toBeInTheDocument()
      })
    })
  })

  describe('Project Loading', () => {
    it('should load and display projects on mount', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue(mockProjects)

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument()
        expect(screen.getByText('Test Project 2')).toBeInTheDocument()
        expect(screen.getByText('Test Project 3')).toBeInTheDocument()
        expect(screen.getByText('Test Project 4')).toBeInTheDocument()
      })
    })

    it('should display project count correctly for multiple projects', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue(mockProjects)

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('4 projects')).toBeInTheDocument()
      })
    })

    it('should display singular project count for one project', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([mockProjects[0]])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('1 project')).toBeInTheDocument()
      })
    })

    it('should display empty state when no projects exist', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/No projects yet/)).toBeInTheDocument()
      })
    })

    it('should display project descriptions when available', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue(mockProjects)

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Test Description 1')).toBeInTheDocument()
        expect(screen.getByText('Test Description 3')).toBeInTheDocument()
      })
    })

    it('should not crash when project has no description', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([mockProjects[1]]) // Project 2 has null description

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('Test Project 2')).toBeInTheDocument()
      })
      
      // Should not render description paragraph
      expect(screen.queryByText('Test Description 2')).not.toBeInTheDocument()
    })

    it('should format project dates correctly', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([mockProjects[0]])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/Created: 10\/15\/2025/)).toBeInTheDocument()
        expect(screen.getByText(/Updated: 10\/15\/2025/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API calls fail', async () => {
      ;(api.checkHealth as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(api.getProjects as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to backend API/)).toBeInTheDocument()
      })
    })

    it('should display backend startup instructions on error', async () => {
      ;(api.checkHealth as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(api.getProjects as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/cd backend && uvicorn app.main:app --reload/)).toBeInTheDocument()
      })
    })

    it('should not show projects when there is an error', async () => {
      ;(api.checkHealth as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(api.getProjects as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to backend API/)).toBeInTheDocument()
      })

      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument()
    })
  })

  describe('Status Badge Styling', () => {
    it('should apply correct styles for planned status', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([mockProjects[0]])

      render(<Home />)

      await waitFor(() => {
        const badge = screen.getByText('PLANNED')
        expect(badge).toHaveClass('bg-yellow-100')
      })
    })

    it('should apply correct styles for in_progress status', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([mockProjects[1]])

      render(<Home />)

      await waitFor(() => {
        const badge = screen.getByText('IN PROGRESS')
        expect(badge).toHaveClass('bg-blue-100')
      })
    })

    it('should apply correct styles for completed status', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([mockProjects[2]])

      render(<Home />)

      await waitFor(() => {
        const badge = screen.getByText('COMPLETED')
        expect(badge).toHaveClass('bg-green-100')
      })
    })

    it('should apply correct styles for archived status', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([mockProjects[3]])

      render(<Home />)

      await waitFor(() => {
        const badge = screen.getByText('ARCHIVED')
        expect(badge).toHaveClass('bg-gray-100')
      })
    })

    it('should apply default styles for unknown status', async () => {
      const unknownProject: Project = {
        ...mockProjects[0],
        status: 'unknown_status' as any,
      }

      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([unknownProject])

      render(<Home />)

      await waitFor(() => {
        const badge = screen.getByText('UNKNOWN STATUS')
        expect(badge).toHaveClass('bg-gray-100')
      })
    })
  })

  describe('Project Form', () => {
    it('should show Create New Project button initially', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })
    })

    it('should display form when Create New Project button is clicked', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Create New Project'))

      expect(screen.getByTestId('project-form')).toBeInTheDocument()
      expect(screen.queryByText('+ Create New Project')).not.toBeInTheDocument()
    })

    it('should hide form and refresh projects when form is submitted successfully', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock)
        .mockResolvedValueOnce([]) // Initial load
        .mockResolvedValueOnce(mockProjects) // After form submit

      render(<Home />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })

      // Show form
      fireEvent.click(screen.getByText('+ Create New Project'))
      expect(screen.getByTestId('project-form')).toBeInTheDocument()

      // Submit form
      fireEvent.click(screen.getByText('Submit Form'))

      // Form should hide and projects should refresh
      await waitFor(() => {
        expect(screen.queryByTestId('project-form')).not.toBeInTheDocument()
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })

      // Projects should be reloaded
      await waitFor(() => {
        expect(api.getProjects).toHaveBeenCalledTimes(2)
      })
    })

    it('should hide form when cancel button is clicked', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })

      // Show form
      fireEvent.click(screen.getByText('+ Create New Project'))
      expect(screen.getByTestId('project-form')).toBeInTheDocument()

      // Cancel form
      fireEvent.click(screen.getByText('Cancel Form'))

      // Form should hide
      await waitFor(() => {
        expect(screen.queryByTestId('project-form')).not.toBeInTheDocument()
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })
    })

    it('should not reload projects when cancel button is clicked', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })

      // Clear mock call count from initial load
      jest.clearAllMocks()

      // Show and cancel form
      fireEvent.click(screen.getByText('+ Create New Project'))
      fireEvent.click(screen.getByText('Cancel Form'))

      // Projects should NOT be reloaded
      expect(api.getProjects).not.toHaveBeenCalled()
    })
  })

  describe('Component Integration', () => {
    it('should call checkHealth and getProjects on mount', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(api.checkHealth).toHaveBeenCalledTimes(1)
        expect(api.getProjects).toHaveBeenCalledTimes(1)
      })
    })

    it('should render all projects with unique keys', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue(mockProjects)

      const { container } = render(<Home />)

      await waitFor(() => {
        // Check that each project card is rendered
        const projectCards = container.querySelectorAll('[class*="p-6 bg-white"]')
        expect(projectCards.length).toBe(4)
      })
    })

    it('should handle rapid form toggle clicks', async () => {
      ;(api.checkHealth as jest.Mock).mockResolvedValue({ status: 'healthy' })
      ;(api.getProjects as jest.Mock).mockResolvedValue([])

      render(<Home />)

      await waitFor(() => {
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })

      // Rapidly toggle form
      fireEvent.click(screen.getByText('+ Create New Project'))
      expect(screen.getByTestId('project-form')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Cancel Form'))
      await waitFor(() => {
        expect(screen.getByText('+ Create New Project')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Create New Project'))
      expect(screen.getByTestId('project-form')).toBeInTheDocument()
    })
  })
})
