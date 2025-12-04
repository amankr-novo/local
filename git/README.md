# Delete GitHub Branches Script

A simple and efficient Node.js script to delete GitHub branches containing a specific keyword using the GitHub REST API.

## Prerequisites

- **Node.js 18+** (required for native `fetch` API support)
- **GitHub Personal Access Token** with `repo` scope

## Getting a GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Branch Deleter")
4. Select the `repo` scope (this gives full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** - you won't be able to see it again!

## Setup

### Pass Token as Flag

You can pass the token directly via the `--token` flag (see usage below).

## Usage

### Basic Syntax

```bash
node delete-branches.js <owner> <repo> <keyword> [--dry-run] [--token <token>]
```

### Parameters

- `<owner>` - GitHub repository owner (e.g., `novohq`)
- `<repo>` - Repository name (e.g., `novo-mobile-api`)
- `<keyword>` - Keyword to search for in branch names (case-sensitive substring match)
- `--dry-run` - (Optional) Preview mode - shows what would be deleted without actually deleting
- `--token <token>` - (Optional) GitHub token

### Examples

#### 1. Preview branches to delete (Dry Run)

Always run with `--dry-run` first to see what will be deleted:

```bash
# Using token flag
node delete-branches.js novohq novo-mobile-api card --token your_token_here --dry-run
```

#### 2. Delete branches containing a keyword

After reviewing the dry-run output, remove `--dry-run` to actually delete:

```bash
# Using token flag
node delete-branches.js novohq novo-mobile-api card --token your_token_here
```

#### 3. Delete branches with different keywords

```bash
# Delete branches containing "feature/old"
node delete-branches.js novohq novo-mobile-api feature/old --dry-run

# Delete branches containing "test"
node delete-branches.js novohq novo-mobile-api test --dry-run

# Delete branches containing "hotfix"
node delete-branches.js novohq novo-mobile-api hotfix --dry-run
```

## How It Works

1. **Fetches all branches** from the specified repository (handles pagination automatically)
2. **Filters branches** that contain the specified keyword in their name
3. **Displays the list** of matching branches
4. **Deletes branches** in parallel (if not in dry-run mode)
5. **Reports results** with success/failure status for each branch

## Safety Features

- ✅ **Dry-run mode**: Always preview before deleting
- ✅ **Case-sensitive matching**: Only matches exact substring
- ✅ **Protected branches**: GitHub API automatically prevents deletion of default branch (usually `main` or `master`)
- ✅ **Error handling**: Continues deleting other branches even if one fails
- ✅ **Detailed reporting**: Shows which branches were deleted and which failed

## Output Example

### Dry Run Output

```
🔍 Searching for branches containing "card" in novohq/novo-mobile-api...

⚠️  DRY RUN MODE - No branches will be deleted

Found 3 matching branch(es):

  - feature/card-updates
  - bugfix/card-validation
  - card/old-implementation

✅ Dry run complete. Run without --dry-run to delete these branches.
```

### Actual Deletion Output

```
🔍 Searching for branches containing "card" in novohq/novo-mobile-api...

Found 3 matching branch(es):

  - feature/card-updates
  - bugfix/card-validation
  - card/old-implementation

🗑️  Deleting branches...

✅ Deleted: feature/card-updates
✅ Deleted: bugfix/card-validation
✅ Deleted: card/old-implementation

📊 Summary: 3 deleted, 0 failed
```

## Troubleshooting

### Error: "GITHUB_TOKEN --token flag is required"

**Solution**: Pass it via `--token` flag:
```bash
export GITHUB_TOKEN=your_token_here
# or
node delete-branches.js <owner> <repo> <keyword> --token your_token_here
```

### Error: "GitHub API error (401): Bad credentials"

**Solution**: Your token is invalid or expired. Generate a new token and update it.

### Error: "GitHub API error (403): Resource not accessible by integration"

**Solution**: Your token doesn't have the `repo` scope. Generate a new token with `repo` permissions.

### Error: "GitHub API error (404): Not Found"

**Solution**: 
- Check that the repository owner and name are correct
- Ensure you have access to the repository
- Verify the repository exists

### Error: "Reference does not exist"

**Solution**: The branch may have already been deleted, or the branch name is incorrect.

### Script shows "Usage" error even with correct arguments

**Solution**: Make sure you're using Node.js 18+ (check with `node --version`). The script requires native `fetch` support.

## Notes

- The script uses **substring matching** - any branch containing the keyword will be matched
- Branch deletion is **permanent** - make sure to use `--dry-run` first
- The default branch (usually `main` or `master`) cannot be deleted via the API
- Deletions happen in **parallel** for efficiency
- The script handles **pagination automatically** for repositories with many branches

## Security

⚠️ **Important**: Never commit your GitHub token to version control. Always pass it as a command-line argument.

## License

This script is provided as-is for internal use.
