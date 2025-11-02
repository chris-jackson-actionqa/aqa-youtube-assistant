# Alembic Quick Reference

## Common Commands
| Command | Description |
|---------|-------------|
| `alembic revision --autogenerate -m "message"` | Create new migration |
| `alembic upgrade head` | Apply all pending migrations |
| `alembic downgrade -1` | Rollback one migration |
| `alembic current` | Show current version |
| `alembic history` | Show all migrations |

## Workflow

1. **Change Model** → `app/models.py`
2. **Generate** → `alembic revision --autogenerate -m "..."`
3. **Review** → Check `alembic/versions/xxx.py`
4. **Test** → `alembic upgrade head`
5. **Commit** → Both model and migration file

## Migration Operations

| Operation | Code |
|-----------|------|
| Add column | `op.add_column('table', sa.Column(...))` |
| Drop column | `op.drop_column('table', 'column')` |
| Create index | `op.create_index('ix_name', 'table', ['col'])` |
| Drop index | `op.drop_index('ix_name', 'table')` |
| Create table | `op.create_table('name', sa.Column(...))` |

## Best Practices

✅ Review auto-generated migrations  
✅ Test upgrade and downgrade  
✅ Make new columns nullable  
✅ Commit migration with model  
❌ Never edit committed migrations  
❌ Never delete migration files
