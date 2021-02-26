import { Probot, Context } from 'probot';

interface PullRequestInfo {
  owner: string
  repo: string
  pull_number: number
}

const getPRInfo = async (context: Context, {
  owner, repo, pull_number
}: PullRequestInfo) => {
  const {
      data: {
        commits,
        head
      }
    } = await context.octokit.pulls.get({
      owner, repo, pull_number
    });
  
  return { prNumCommits: commits, prHeadSha: head.sha, prBranchName: head.ref }
}

const createEmptyCommit = async (
  context: Context,
  {
    owner,
    repo,
    prHeadSha
  }: PullRequestInfo & { prHeadSha: string }
) => {
  const { data: { sha } } = await context.octokit.git.createCommit({
        owner,
        repo,
        message: 'empty commit',
        tree: '', //TODO To check how to get the SHA of the tree object this commit points to
        parent: prHeadSha
  })
  
  return sha
}

const pushCommitToBranch = (
  context: Context,
  {
    owner,
    repo,
    branchName,
    commitSha
  }: PullRequestInfo & { branchName: string, commitSha: string},
) => {
  return context.octokit.git.createRef({
        owner,
        repo,
        ref: branchName,
        sha: commitSha
      })
}

module.exports = (app: Probot): void => {
  app.log("Yay! The app was loaded!");

  //TODO pull_request.opened should be an event too?
  app.on("pull_request.edited", async (context) => {
    const { pullRequest } = context

    const pullRequestInfo = pullRequest();

    const {
      prNumCommits,
      prHeadSha,
      prBranchName
    } = await getPRInfo(context, pullRequestInfo)

    if (prNumCommits === 1) {
      const emptyCommitSha = await createEmptyCommit(context, {
        ...pullRequestInfo,
        prHeadSha
      })

      return pushCommitToBranch(context, {
        ...pullRequestInfo,
        branchName: prBranchName,
        commitSha: emptyCommitSha
      })
    }

    return 'not a single commit PR';
  });
};
