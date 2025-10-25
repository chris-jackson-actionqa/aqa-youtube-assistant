/**
 * Unit tests for ProjectForm component
 * Tests form rendering, validation, submission, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectForm from '../ProjectForm'
import * as api from '../../lib/api'

// Mock the API module
jest.mock('../../lib/api')

describe('ProjectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the form with all fields', () => {
      render(<ProjectForm />)
      
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument()
    })

    it('should show cancel button when onCancel prop is provided', () => {
      const onCancel = jest.fn()
      render(<ProjectForm onCancel={onCancel} />)
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should not show cancel button when onCancel prop is not provided', () => {
      render(<ProjectForm />)
      
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when title is empty', () => {
      render(<ProjectForm />)
      
      const submitButton = screen.getByRole('button', { name: /create project/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when title is provided', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)
      
      const titleInput = screen.getByLabelText(/project name/i)
      await user.type(titleInput, 'Test Project')
      
      const submitButton = screen.getByRole('button', { name: /create project/i })
      expect(submitButton).toBeEnabled()
    })

    it('should respect maxLength of 255 characters for title', () => {
      render(<ProjectForm />)
      
      const titleInput = screen.getByLabelText(/project name/i) as HTMLInputElement
      expect(titleInput.maxLength).toBe(255)
    })

    it('should trim leading and trailing whitespace from project name', async () => {
      const user = userEvent.setup()
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: null,
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      ;(api.createProject as jest.Mock).mockResolvedValue(mockProject)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), '  Test Project  ')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: 'Test Project',
          description: null,
          status: 'planned',
        })
      })
    })

    it('should reject whitespace-only project name', async () => {
      const user = userEvent.setup()
      
      render(<ProjectForm />)
      
      const nameInput = screen.getByLabelText(/project name/i)
      await user.type(nameInput, '   ')
      
      const submitButton = screen.getByRole('button', { name: /create project/i })
      expect(submitButton).toBeDisabled()
      
      expect(api.createProject).not.toHaveBeenCalled()
    })

    it('should show error message for whitespace-only name when validation is bypassed', async () => {
      const user = userEvent.setup()
      
      render(<ProjectForm />)
      
      const nameInput = screen.getByLabelText(/project name/i) as HTMLInputElement
      const form = nameInput.closest('form') as HTMLFormElement
      
      // Type whitespace
      await user.type(nameInput, '   ')
      
      // Remove the required attribute and disabled state to bypass HTML5 and button validation
      nameInput.removeAttribute('required')
      const submitButton = screen.getByRole('button', { name: /create project/i })
      submitButton.removeAttribute('disabled')
      
      // Submit the form
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/project name cannot be empty or contain only whitespace/i)).toBeInTheDocument()
      })
      
      expect(api.createProject).not.toHaveBeenCalled()
    })

    it('should respect maxLength of 2000 characters for description', () => {
      render(<ProjectForm />)
      
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement
      expect(descriptionInput.maxLength).toBe(2000)
    })

    it('should convert empty description to null', async () => {
      const user = userEvent.setup()
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: null,
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      ;(api.createProject as jest.Mock).mockResolvedValue(mockProject)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      // Leave description empty
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: 'Test Project',
          description: null,
          status: 'planned',
        })
      })
    })

    it('should convert whitespace-only description to null', async () => {
      const user = userEvent.setup()
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: null,
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      ;(api.createProject as jest.Mock).mockResolvedValue(mockProject)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.type(screen.getByLabelText(/description/i), '   ')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: 'Test Project',
          description: null,
          status: 'planned',
        })
      })
    })

    it('should display character counter for description', () => {
      render(<ProjectForm />)
      
      expect(screen.getByText('0 / 2000 characters')).toBeInTheDocument()
    })

    it('should update character counter as user types', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)
      
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Hello World')
      
      expect(screen.getByText('11 / 2000 characters')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call createProject API with correct data', async () => {
      const user = userEvent.setup()
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: 'Test Description',
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      ;(api.createProject as jest.Mock).mockResolvedValue(mockProject)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: 'Test Project',
          description: 'Test Description',
          status: 'planned',
        })
      })
    })

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup()
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: null,
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      ;(api.createProject as jest.Mock).mockResolvedValue(mockProject)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/project "test project" created successfully!/i)).toBeInTheDocument()
      })
    })

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: 'Test Description',
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      ;(api.createProject as jest.Mock).mockResolvedValue(mockProject)
      
      render(<ProjectForm />)
      
      const titleInput = screen.getByLabelText(/project name/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement
      
      await user.type(titleInput, 'Test Project')
      await user.type(descriptionInput, 'Test Description')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(titleInput.value).toBe('')
        expect(descriptionInput.value).toBe('')
      })
    })

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      const onSuccess = jest.fn()
      const mockProject = {
        id: 1,
        name: 'Test Project',
        description: null,
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      ;(api.createProject as jest.Mock).mockResolvedValue(mockProject)
      
      render(<ProjectForm onSuccess={onSuccess} />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      // Wait for the 1.5s delay before callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should disable form during submission', async () => {
      const user = userEvent.setup()
      
      // Mock API to delay response
      ;(api.createProject as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      
      const submitButton = screen.getByRole('button', { name: /create project/i })
      await user.click(submitButton)
      
      expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message on API failure with object details', async () => {
      const user = userEvent.setup()
      
      // Create a proper ApiError instance
      const apiError = Object.create(api.ApiError.prototype)
      apiError.message = 'Bad Request'
      apiError.status = 400
      apiError.details = { detail: 'Project already exists' }
      apiError.name = 'ApiError'
      
      ;(api.createProject as jest.Mock).mockRejectedValue(apiError)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Duplicate Project')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Project already exists')).toBeInTheDocument()
      })
    })

    it('should display error message when details is not an object', async () => {
      const user = userEvent.setup()
      
      // Create ApiError with non-object details (string)
      const apiError = Object.create(api.ApiError.prototype)
      apiError.message = 'Invalid request'
      apiError.status = 400
      apiError.details = 'String error details'
      apiError.name = 'ApiError'
      
      ;(api.createProject as jest.Mock).mockRejectedValue(apiError)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Invalid request')).toBeInTheDocument()
      })
    })

    it('should handle duplicate title error specifically', async () => {
      const user = userEvent.setup()
      
      // Create a proper ApiError instance
      const apiError = Object.create(api.ApiError.prototype)
      apiError.message = 'Bad Request'
      apiError.status = 400
      apiError.details = { detail: 'Project with title "Test" already exists (case-insensitive match)' }
      apiError.name = 'ApiError'
      
      ;(api.createProject as jest.Mock).mockRejectedValue(apiError)
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument()
      })
    })

    it('should show generic error for unexpected errors', async () => {
      const user = userEvent.setup()
      
      ;(api.createProject as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      render(<ProjectForm />)
      
      await user.type(screen.getByLabelText(/project name/i), 'Test Project')
      await user.click(screen.getByRole('button', { name: /create project/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = jest.fn()
      
      render(<ProjectForm onCancel={onCancel} />)
      
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(onCancel).toHaveBeenCalled()
    })

    it('should clear form when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = jest.fn()
      
      render(<ProjectForm onCancel={onCancel} />)
      
      const titleInput = screen.getByLabelText(/project name/i) as HTMLInputElement
      await user.type(titleInput, 'Test Project')
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(titleInput.value).toBe('')
    })
  })

  describe('Status Selection', () => {
    it('should default to "planned" status', () => {
      render(<ProjectForm />)
      
      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement
      expect(statusSelect.value).toBe('planned')
    })

    it('should allow changing status', async () => {
      const user = userEvent.setup()
      render(<ProjectForm />)
      
      const statusSelect = screen.getByLabelText(/status/i)
      await user.selectOptions(statusSelect, 'in_progress')
      
      expect((statusSelect as HTMLSelectElement).value).toBe('in_progress')
    })
  })
})
