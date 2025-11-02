# Database Migration Workflow

## Overview

We use Alembic for database migrations. Migrations run automatically on application startup, so you never need to manually update databases.

## Creating a New Migration

### Step 1: Update Models

Make your changes to `backend/app/models.py`:

```python
class Project(Base):
    # ... existing fields
    workspace_id = Column(Integer, nullable=True)  # NEW FIELD
```

### Step 2: Generate Migration

Let Alembic detect your changes:

```bash
cd backend
alembic revision --autogenerate -m "Add workspace_id to projects"
```

This creates a new file in `alembic/versions/`.

### Step 3: Review Generated Migration

**IMPORTANT**: Always review the generated migration!

```python
# alembic/versions/003_add_workspace_id.py

def upgrade():
    # Check this matches your intent
    op.add_column('projects', 
        sa.Column('workspace_id', sa.Integer(), nullable=True)
    )
    
def downgrade():
    # Verify rollback logic is correct
    op.drop_column('projects', 'workspace_id')
```

### Step 4: Test Migration

```bash
# Test upgrade
alembic upgrade head

# Test downgrade (optional but recommended)
alembic downgrade -1

# Upgrade again
alembic upgrade head
```

### Step 5: Commit

```bash
git add backend/app/models.py
git add alembic/versions/003_add_workspace_id.py
git commit -m "Add workspace_id to projects table"
```

### Step 6: Push and Deploy

```bash
git push
```

The migration will run automatically when:
- Teammates pull and start their dev server
- CI/CD runs tests
- Production deployment starts

## Common Scenarios

### Adding a Column
```python
def upgrade():
    op.add_column('projects', 
        sa.Column('new_field', sa.String(100), nullable=True)
    )
```

### Removing a Column
```python
def upgrade():
    op.drop_column('projects', 'old_field')
```

### Adding an Index
```python
def upgrade():
    op.create_index('ix_projects_field', 'projects', ['field'])
```

### Renaming a Column (requires data migration)
```python
def upgrade():
    # SQLite doesn't support direct rename, so:
    # 1. Add new column
    op.add_column('projects', sa.Column('new_name', sa.String()))
    
    # 2. Copy data
    op.execute('UPDATE projects SET new_name = old_name')
    
    # 3. Drop old column
    op.drop_column('projects', 'old_name')
```

## Troubleshooting

### Migration Fails
1. Check error message in logs
2. Review migration file for issues
3. Test on empty database: `rm youtube_assistant.db && alembic upgrade head`

### Merge Conflicts in Migrations
If two branches both add migrations:
```bash
alembic merge head1 head2 -m "Merge migrations"
```

### Reset Database (Development Only)
```bash
rm youtube_assistant.db
# Next app start will recreate from migrations
```

## Best Practices

1. ✅ **Always review** auto-generated migrations
2. ✅ **Test both upgrade and downgrade**
3. ✅ **Make migrations backwards compatible** (additive changes)
4. ✅ **Use nullable=True for new columns** (existing rows)
5. ✅ **Commit migrations with model changes**
6. ✅ **Write descriptive migration messages**
7. ❌ **Never edit committed migrations** (create new one instead)
8. ❌ **Never delete migration files**

## Useful Commands

```bash
# Show current version
alembic current

# Show migration history
alembic history

# Upgrade to specific version
alembic upgrade abc123

# Downgrade one version
alembic downgrade -1

# Downgrade to base (empty database)
alembic downgrade base

# Show SQL without running
alembic upgrade head --sql
```

## For Production

Migrations run automatically on deployment, but you can also run manually:

```bash
export DATABASE_URL="postgresql://user:pass@host/db"
alembic upgrade head
```
