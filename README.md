# squash-commit-app

GitHub App which adds an empty commit to an open Pull Request with a single commit when the title was changed.

⚠️ The existance of this app doesn't make much sense since now [GitHub solves this natively](#present).

## Context

Given a Pull Request, if it only has one commit, when you try to squash-and-merge, the default message used for that squashed commit will be the commit message of that single commit instead of the Pull Request title.

Sometimes this is not the desired behavior (when you want to use conventional commits for example). When a PR has 2 or more commits, GitHub uses the PR title, so the goal of this GitHub App is to enforce using the PR title as a commit message when doing a squash-and-merge.

You can find more context [in this Twitter thread](https://twitter.com/gr2m/status/1449069394156408834?s=20&t=aeZ1WG4ltHpPZk7QeF4yzw)

### Present
Recently, GitHub released an option to do that so this App is not necessary anymore: https://github.blog/changelog/2022-05-11-default-to-pr-titles-for-squash-merge-commit-messages/
