import { Probot, Context } from "probot";

interface PullRequestInfo {
  owner: string;
  repo: string;
  pull_number: number;
}

const getPRInfo = async (
  context: Context,
  { owner, repo, pull_number }: PullRequestInfo
) => {
  const {
    data: { commits, head },
  } = await context.octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });

  return { prNumCommits: commits, prHeadSha: head.sha, prBranchName: head.ref };
};

async function getCommit(
  context: Context,
  sha: string,
  owner: string,
  repo: string
): Promise<any> {
  const commit = await context.octokit.git.getCommit({
    owner,
    repo,
    // eslint-disable-next-line @typescript-eslint/camelcase
    commit_sha: sha,
  });
  return commit.data;
}

async function createEmptyCommit(
  context: Context,
  refCommit: any,
  owner: string,
  repo: string
): Promise<any> {
  context.log.info("Creating empty commit");
  const commit = await context.octokit.git.createCommit({
    owner,
    repo,
    message: `empty commit to preset the squash & merge commit subject from the pull request title

Created by https://github.com/gr2m/squash-commit-app`,
    tree: refCommit.tree.sha,
    parents: [refCommit.sha],
  });
  return commit.data;
}

async function updateRef(
  context: Context,
  sha: string,
  branch: string,
  owner: string,
  repo: string
): Promise<any> {
  context.log.info(`Changing ref for ${branch} to`, sha);
  const ref = await context.octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha,
  });
  return ref.data;
}

module.exports = (app: Probot): void => {
  app.log("Yay! The app was loaded!");

  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context) => {
      context.log.debug("PR edited!");
      const {
        payload: { pull_request, repository },
      } = context;

      const pullRequestInfo = {
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
      };

      try {
        const { prNumCommits, prHeadSha, prBranchName } = await getPRInfo(
          context,
          pullRequestInfo
        );

        if (prNumCommits > 1) {
          context.log.info("not a single commit PR");
          return;
        } else {
          const commit = await getCommit(
            context,
            prHeadSha,
            pullRequestInfo.owner,
            pullRequestInfo.repo
          );

          const empty = await createEmptyCommit(
            context,
            commit,
            pullRequestInfo.owner,
            pullRequestInfo.repo
          );

          return updateRef(
            context,
            empty.sha,
            prBranchName,
            pullRequestInfo.owner,
            pullRequestInfo.repo
          );
        }
      } catch (e) {
        context.log.error(e);
        throw e;
      }
    }
  );
};
