# Test Branch Workflow

This guide explains how to push a test branch to GitHub and open a pull request for this repository.

## 1. Create and push the branch

```bash
git checkout -b test-branch
# Make your changes and commit them
# git commit -am "Describe your changes"

git push -u origin test-branch
```

If `origin` is not set up yet, add it by running:

```bash
git remote add origin git@github.com:<your-user>/zahav-connect-ai.git
```

## 2. Open a pull request

You can open a pull request through the GitHub web interface or with the GitHub CLI.

### Using the GitHub web interface

1. Navigate to your fork on GitHub.
2. Click **Compare & pull request** next to the newly pushed branch.
3. Fill in the PR title and description, then click **Create pull request**.

### Using the GitHub CLI (optional)

If you have the [GitHub CLI](https://cli.github.com/) installed and authenticated, you can create the PR from the terminal:

```bash
gh pr create --title "My test changes" --body "Summary of what changed." --base main --head test-branch
```

Adjust the `--title`, `--body`, `--base`, and `--head` values to match your workflow.
