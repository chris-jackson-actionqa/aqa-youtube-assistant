/**
 * Global Setup for Playwright E2E Tests
 *
 * Runs once before all tests to:
 * - Set DATABASE_URL to test database (separate from development database)
 * - Clean the test environment
 * - Reset the test database
 * - Run database migrations
 * - Create default workspace (id=1) for backwards compatibility
 *
 * IMPORTANT: E2E tests use a separate test database (youtube_assistant_test.db)
 * to avoid interfering with development data.
 *
 * Related: Issue #95 - Parallel test execution with workspace isolation
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Set test database URL for backend to use during E2E tests
process.env.DATABASE_URL = 'sqlite:///./youtube_assistant_test.db';

/**
 * Main global setup function
 */
export default async function globalSetup() {
  console.log('🧹 Cleaning up test environment...');

  // Delete TEST database (not development database!)
  const testDbPath = path.join(__dirname, '../backend/youtube_assistant_test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('✓ Deleted existing test database');
  }

  clearPythonCache();

  // Run database migration on test database
  await runMigration();

  // Create default workspace (id=1)
  await ensureDefaultWorkspace();

  console.log('✅ Environment ready for testing');
}

/**
 * Clear Python cache files
 */
function clearPythonCache() {
  const backendPath = path.join(__dirname, '../backend');
  const pycacheDirs = ['__pycache__', 'app/__pycache__'];

  for (const dir of pycacheDirs) {
    const fullPath = path.join(backendPath, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }

  console.log('✓ Cleared Python cache');
}

/**
 * Run database migration to create tables
 */
async function runMigration(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'python',
      [
        '-c',
        `
from app.database import SessionLocal, engine, Base
from app.models import Project, Workspace

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database tables created")
        `,
      ],
      {
        cwd: path.join(__dirname, '../backend'),
        env: {
          ...process.env,
          DATABASE_URL: 'sqlite:///./youtube_assistant_test.db',
        },
      }
    );

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      console.error(`Migration error: ${data}`);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Database migration complete');
        console.log(output.trim());
        resolve();
      } else {
        reject(new Error(`Migration failed with exit code ${code}`));
      }
    });
  });
}

/**
 * Ensure default workspace exists (workspace_id=1)
 * This provides backwards compatibility for tests that expect a default workspace
 */
async function ensureDefaultWorkspace(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'python',
      [
        '-c',
        `
from app.database import SessionLocal, engine, Base
from app.models import Workspace

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Check if default workspace exists
if not db.query(Workspace).filter(Workspace.id == 1).first():
    workspace = Workspace(id=1, name="Default Workspace", description="Default workspace for all projects")
    db.add(workspace)
    db.commit()
    print("Created default workspace")
else:
    print("Default workspace already exists")

db.close()
        `,
      ],
      {
        cwd: path.join(__dirname, '../backend'),
        env: {
          ...process.env,
          DATABASE_URL: 'sqlite:///./youtube_assistant_test.db',
        },
      }
    );

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      console.error(`Workspace setup error: ${data}`);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${output.trim()}`);
        resolve();
      } else {
        reject(new Error(`Failed to create default workspace: exit code ${code}`));
      }
    });
  });
}
