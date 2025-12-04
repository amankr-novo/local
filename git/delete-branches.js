#!/usr/bin/env node

/**
 * Script to delete GitHub branches containing a specific keyword using REST API
 * Usage: node delete-branches.js <owner> <repo> <keyword> [--dry-run]
 * 
 * Requires GITHUB_TOKEN environment variable or pass as --token flag
 */

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const tokenIndex = args.indexOf('--token');
const token = tokenIndex !== -1 && args[tokenIndex + 1]
  ? args[tokenIndex + 1]
  : process.env.GITHUB_TOKEN;

const [owner, repo, keyword] = args.filter(arg =>
  !arg.startsWith('--') && arg !== args[tokenIndex + 1]
);

// Validate inputs
if (!owner || !repo || !keyword) {
  console.error('Usage: node delete-branches.js <owner> <repo> <keyword> [--dry-run] [--token <token>]');
  console.error('Example: node delete-branches.js octocat hello-world feature/old --dry-run');
  process.exit(1);
}

if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable or --token flag is required');
  process.exit(1);
}

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Make a GitHub API request
 */
async function githubRequest(endpoint, options = {}) {
  const url = `${GITHUB_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Branch-Deleter',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

/**
 * Get all branches for a repository
 */
async function getAllBranches(owner, repo) {
  const branches = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const data = await githubRequest(
        `/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`
      );

      if (!data || data.length === 0) break;

      branches.push(...data);

      if (data.length < perPage) break;
      page++;
    }

    return branches;
  } catch (error) {
    console.error(`Error fetching branches: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a branch by deleting its reference
 */
async function deleteBranch(owner, repo, branchName) {
  try {
    // Delete the git reference: refs/heads/branch-name
    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
      method: 'DELETE',
    });

    return { success: true, branch: branchName };
  } catch (error) {
    return {
      success: false,
      branch: branchName,
      error: error.message
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`\n🔍 Searching for branches containing "${keyword}" in ${owner}/${repo}...\n`);

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No branches will be deleted\n');
  }

  try {
    // Get all branches
    const branches = await getAllBranches(owner, repo);

    // Filter branches containing the keyword
    const matchingBranches = branches
      .map(branch => branch.name)
      .filter(branchName => branchName.includes(keyword));

    if (matchingBranches.length === 0) {
      console.log(`✅ No branches found containing "${keyword}"`);
      return;
    }

    console.log(`Found ${matchingBranches.length} matching branch(es):\n`);
    matchingBranches.forEach(branch => console.log(`  - ${branch}`));
    console.log('');

    if (dryRun) {
      console.log('✅ Dry run complete. Run without --dry-run to delete these branches.');
      return;
    }

    // Delete branches in parallel
    console.log('🗑️  Deleting branches...\n');

    const deleteResults = await Promise.allSettled(
      matchingBranches.map(branch => deleteBranch(owner, repo, branch))
    );

    // Report results
    let successCount = 0;
    let failureCount = 0;

    deleteResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { success, branch, error } = result.value;
        if (success) {
          console.log(`✅ Deleted: ${branch}`);
          successCount++;
        } else {
          console.log(`❌ Failed to delete ${branch}: ${error}`);
          failureCount++;
        }
      } else {
        console.log(`❌ Failed to delete ${matchingBranches[index]}: ${result.reason}`);
        failureCount++;
      }
    });

    console.log(`\n📊 Summary: ${successCount} deleted, ${failureCount} failed\n`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the script
main();