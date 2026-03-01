# Claude Command: Commit

This command helps you create well-formatted commits with conventional commit messages.

## Usage

To create a commit, just type:

```
/commit
```

Or with options:

```
/commit --no-verify
```

## What This Command Does

1. Unless specified with `--no-verify`, automatically runs pre-commit checks:
   - `cd backend && mvn clean compile -DskipTests` to verify Java compilation
   - `cd frontend && npx tsc --noEmit` to verify TypeScript types
2. Checks which files are staged with `git status`
3. If 0 files are staged, automatically adds all modified and new files with `git add`
4. Performs a `git diff` to understand what changes are being committed
5. Analyzes the diff to determine if multiple distinct logical changes are present
6. If multiple distinct changes are detected, suggests breaking the commit into multiple smaller commits
7. For each commit (or the single commit if not split), creates a commit message using conventional commit format

## Best Practices for Commits

- **Verify before committing**: Ensure backend compiles and frontend types check
- **Atomic commits**: Each commit should contain related changes that serve a single purpose
- **Split large changes**: If changes touch multiple concerns, split them into separate commits
- **Conventional commit format**: Use the format `<type>: <description>` where type is one of:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation changes
  - `style`: Code style changes (formatting, etc)
  - `refactor`: Code changes that neither fix bugs nor add features
  - `perf`: Performance improvements
  - `test`: Adding or fixing tests
  - `chore`: Changes to the build process, tools, etc.
- **Present tense, imperative mood**: Write commit messages as commands (e.g., "add feature" not "added feature")
- **Concise first line**: Keep the first line under 72 characters

## Guidelines for Splitting Commits

When analyzing the diff, consider splitting commits based on these criteria:

1. **Different concerns**: Changes to unrelated parts of the codebase
2. **Different types of changes**: Mixing features, fixes, refactoring, etc.
3. **File patterns**: Changes to different layers (e.g., backend Java vs frontend React vs SQL migrations)
4. **Logical grouping**: Changes that would be easier to understand or review separately
5. **Size**: Very large changes that would be clearer if broken down

## Examples

Good commit messages:

- feat: agregar sistema de autenticacion de usuarios
- fix: resolver N+1 en consulta de clientes con armas
- docs: actualizar documentacion API con nuevos endpoints
- refactor: simplificar logica de manejo de errores en servicios
- feat: implementar generacion de contrato para policia (ISSPOL)
- fix: corregir template de cotizacion para fuerza terrestre (ISSFA)
- perf: agregar @EntityGraph para evitar N+1 en ClienteQueryService
- refactor: separar ClienteService en Service + QueryService (SRP)
- chore: actualizar SQL maestro con nuevo campo en cliente

Example of splitting commits:

- First commit: feat: agregar nuevo endpoint para consulta de grupos de importacion
- Second commit: feat: agregar componente React para gestion de grupos
- Third commit: refactor: extraer logica de matching a GrupoImportacionMatchingService
- Fourth commit: test: agregar tests para GrupoImportacionService

## Command Options

- `--no-verify`: Skip running the pre-commit checks (compile, type check)

## Important Notes

- By default, pre-commit checks (`mvn compile`, `tsc --noEmit`) will run to ensure code quality
- If these checks fail, you'll be asked if you want to proceed with the commit anyway or fix the issues first
- If specific files are already staged, the command will only commit those files
- If no files are staged, it will automatically stage all modified and new files
- The commit message will be constructed based on the changes detected
- Before committing, the command will review the diff to identify if multiple commits would be more appropriate
- If suggesting multiple commits, it will help you stage and commit the changes separately
- Always reviews the commit diff to ensure the message matches the changes
- **REMEMBER**: After committing Java/template changes, remind the user to restart Docker:
  `docker-compose -f docker-compose.local.yml restart backend_local`
