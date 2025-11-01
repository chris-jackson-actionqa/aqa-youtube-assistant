/**
 * Global Teardown for Playwright E2E Tests
 *
 * Runs once after all tests to:
 * - Clean up any remaining test workspaces
 * - Report cleanup status
 *
 * Related: Issue #95 - Parallel test execution with workspace isolation
 */

import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Main global teardown function
 */
export default async function globalTeardown() {
  console.log('🧹 Running global teardown...');

  await cleanupTestWorkspaces();

  console.log('✅ Global teardown complete');
}

/**
 * Clean up any test workspaces that weren't properly deleted
 * This is a safety net - individual tests should clean up after themselves
 */
async function cleanupTestWorkspaces(): Promise<void> {
  return new Promise((resolve) => {
    const proc = spawn(
      'python',
      [
        '-c',
        `
from app.database import SessionLocal
from app.models import Workspace, Project

db = SessionLocal()

try:
    # Find all test workspaces (name starts with "test-")
    test_workspaces = db.query(Workspace).filter(
        Workspace.name.like("test-%")
    ).all()
    
    if test_workspaces:
        print(f"Found {len(test_workspaces)} test workspaces to clean up")
        
        for workspace in test_workspaces:
            # Delete all projects in workspace
            projects = db.query(Project).filter(
                Project.workspace_id == workspace.id
            ).all()
            
            for project in projects:
                db.delete(project)
            
            # Delete workspace
            db.delete(workspace)
        
        db.commit()
        print(f"Cleaned up {len(test_workspaces)} test workspaces")
    else:
        print("No test workspaces to clean up")
        
except Exception as e:
    print(f"Error during cleanup: {e}")
    db.rollback()
finally:
    db.close()
        `,
      ],
      { cwd: path.join(__dirname, '../backend') }
    );

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      console.error(`Cleanup error: ${data}`);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${output.trim()}`);
      } else {
        console.warn(`⚠ Cleanup completed with warnings (exit code ${code})`);
      }
      // Always resolve - don't fail the build if cleanup has issues
      resolve();
    });
  });
}
