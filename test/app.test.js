const { suite } = require("uvu");
const { equal } = require("uvu/assert");

const nock = require("nock");
nock.disableNetConnect();

const { Probot, ProbotOctokit } = require("probot");

const app = require("../src/http/post-api-github-webhooks/app.js");

/** @type {import('probot').Probot */
let probot;
const testPRSingleCommit = suite("with Single Commit");

testPRSingleCommit.before.each(() => {
  probot = new Probot({
    // simple authentication as alternative to appId/privateKey
    githubToken: "test",
    // disable logs
    logLevel: "warn",
    // disable request throttling and retries
    Octokit: ProbotOctokit.defaults({
      throttle: { enabled: false },
      retry: { enabled: false },
    }),
  });
  probot.load(app);
});

testPRSingleCommit.after(nock.cleanAll)

const owner = "my-username";
const repo = "my-awesome-repo";
const prNumber = 1;
const commitSha = "6dcb09b5b57875f334f61aebed695e2e4193db5e";
const branchName = "branch-name-pr";
const treeSha = "691272480426f78a0138979dd3ce63b77f706feb";
const emptyCommitSha = "7638417db6d59f3c431d3e1f261cc637155684cd";
const ref = `heads%2F${branchName}`;
const prEventsListened = ["edited"]
const prEventsIgnored = ["opened", "reopened", "synchronize", "edited"]

prEventsListened.forEach((prEvent) => {
  testPRSingleCommit(
    `recieves pull_request.${prEvent} event`,
    async function () {
      const mock = nock("https://api.github.com")
        .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
        .reply(200, {
          commits: 1,
          head: {
            sha: commitSha,
            ref: branchName,
          },
        })
        .get(`/repos/${owner}/${repo}/git/commits/${commitSha}`)
        .reply(200, {
          sha: commitSha,
          tree: {
            sha: treeSha,
          },
        })
        .post(`/repos/${owner}/${repo}/git/commits`, (requestBody) => {
          equal(requestBody, {
            message: `empty commit to preset the squash & merge commit subject from the pull request title

Learn more at https://github.com/squash-commit-app/squash-commit-app`,
            tree: treeSha,
            parents: [commitSha],
          });

          return true;
        })
        .reply(201, {
          sha: emptyCommitSha,
        })
        .patch(`/repos/${owner}/${repo}/git/refs/${ref}`, (requestBody) => {
          equal(requestBody, {
            sha: emptyCommitSha,
          });

          return true;
        })
        .reply(200);

      await probot.receive({
        name: "pull_request",
        id: "1",
        payload: {
          action: prEvent,
          repository: {
            owner: {
              login: owner,
            },
            name: repo,
          },
          pull_request: {
            number: prNumber,
          },
        },
      });

      equal(mock.activeMocks(), []);
    }
  );
});

prEventsIgnored.forEach((prEvent) => {
  testPRSingleCommit(
    `ignores pull_request.${prEvent} event`,
    async function () {
      const mock = nock("https://api.github.com")
        .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
        .reply(200, {
          commits: 1,
          head: {
            sha: commitSha,
            ref: branchName,
          },
        })
        .get(`/repos/${owner}/${repo}/git/commits/${commitSha}`)
        .reply(200, {
          sha: commitSha,
          tree: {
            sha: treeSha,
          },
        })
        .post(`/repos/${owner}/${repo}/git/commits`, (requestBody) => {
          equal(requestBody, {
            message: `empty commit to preset the squash & merge commit subject from the pull request title

Learn more at https://github.com/squash-commit-app/squash-commit-app`,
            tree: treeSha,
            parents: [commitSha],
          });

          return true;
        })
        .reply(201, {
          sha: emptyCommitSha,
        })
        .patch(`/repos/${owner}/${repo}/git/refs/${ref}`, (requestBody) => {
          equal(requestBody, {
            sha: emptyCommitSha,
          });

          return true;
        })
        .reply(200);

      await probot.receive({
        name: "pull_request",
        id: "1",
        payload: {
          action: prEvent,
          repository: {
            owner: {
              login: owner,
            },
            name: repo,
          },
          pull_request: {
            number: prNumber,
          },
        },
      });

      equal(mock.pendingMocks().length, 4)
      equal(mock.pendingMocks(), [
       `GET https://api.github.com:443/repos/${owner}/${repo}/pulls/${prNumber}`,
       `GET https://api.github.com:443/repos/${owner}/${repo}/git/commits/${commitSha}`,
       `POST https://api.github.com:443/repos/${owner}/${repo}/git/commits`,
       `PATCH https://api.github.com:443/repos/${owner}/${repo}/git/refs/${ref}`
      ]);

    }
  );
});

testPRSingleCommit.run();

// ---

const testPRWithMultipleCommits = suite("with Multiple Commits");

prEventsListened.forEach((prEvent) => {
  testPRWithMultipleCommits(
    `recieves pull_request.${prEvent} event`,
    async function () {
      const mock = nock("https://api.github.com")
        .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
        .reply(200, {
          commits: 11,
          head: {
            sha: commitSha,
            ref: branchName,
          },
        });

      await probot.receive({
        name: "pull_request",
        id: "1",
        payload: {
          action: prEvent,
          repository: {
            owner: {
              login: owner,
            },
            name: repo,
          },
          pull_request: {
            number: prNumber,
          },
        },
      });

      equal(mock.activeMocks(), []);
    }
  );
});

testPRWithMultipleCommits.run();
