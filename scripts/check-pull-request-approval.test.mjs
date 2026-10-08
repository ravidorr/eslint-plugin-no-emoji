import assert from "node:assert/strict";
import test from "node:test";

import {
  checkPullRequestApproval,
  hasValidApproval,
} from "./check-pull-request-approval.mjs";

const review = (login, state) => ({ state, user: { login } });

test("accepts an approving review from someone other than the author", () => {
  assert.equal(
    hasValidApproval({
      reviews: [review("maintainer", "APPROVED")],
      authorLogin: "contributor",
      repositoryOwnerLogin: "owner",
    }),
    true,
  );
});

test("allows a pull request authored by the repository owner", () => {
  assert.equal(
    hasValidApproval({
      reviews: [],
      authorLogin: "owner",
      repositoryOwnerLogin: "owner",
    }),
    true,
  );
});

test("does not count an approval from the non-owner author", () => {
  assert.equal(
    hasValidApproval({
      reviews: [review("contributor", "APPROVED")],
      authorLogin: "Contributor",
      repositoryOwnerLogin: "owner",
    }),
    false,
  );
});

test("uses a reviewer's latest submitted state", () => {
  assert.equal(
    hasValidApproval({
      reviews: [
        review("maintainer", "APPROVED"),
        review("maintainer", "CHANGES_REQUESTED"),
      ],
      authorLogin: "contributor",
      repositoryOwnerLogin: "owner",
    }),
    false,
  );
});

test("accepts a reviewer whose latest state is approval", () => {
  assert.equal(
    hasValidApproval({
      reviews: [
        review("maintainer", "CHANGES_REQUESTED"),
        review("maintainer", "APPROVED"),
      ],
      authorLogin: "contributor",
      repositoryOwnerLogin: "owner",
    }),
    true,
  );
});

test("ignores pending and anonymous reviews", () => {
  assert.equal(
    hasValidApproval({
      reviews: [{ state: "PENDING", user: { login: "maintainer" } }, { state: "APPROVED" }],
      authorLogin: "contributor",
      repositoryOwnerLogin: "owner",
    }),
    false,
  );
});

test("retrieves the pull request and reviews from the GitHub API", async () => {
  const originalFetch = globalThis.fetch;
  const paths = [];

  globalThis.fetch = async (url) => {
    paths.push(url);
    const isReviewsRequest = url.includes("/reviews?");

    return {
      ok: true,
      json: async () =>
        isReviewsRequest
          ? [review("maintainer", "APPROVED")]
          : { user: { login: "contributor" } },
    };
  };

  try {
    assert.equal(
      await checkPullRequestApproval({
        apiBase: "https://github.example.test",
        repository: "owner/repository",
        pullNumber: 15,
        token: "token",
      }),
      true,
    );
    assert.deepEqual(paths, [
      "https://github.example.test/repos/owner/repository/pulls/15",
      "https://github.example.test/repos/owner/repository/pulls/15/reviews?per_page=100&page=1",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uses the latest review across paginated GitHub API responses", async () => {
  const originalFetch = globalThis.fetch;
  const firstPage = Array.from({ length: 100 }, (_, index) =>
    review(index === 99 ? "maintainer" : `reviewer-${index}`, index === 99 ? "APPROVED" : "COMMENTED"),
  );

  globalThis.fetch = async (url) => {
    if (url.endsWith("/pulls/15")) {
      return {
        ok: true,
        json: async () => ({ user: { login: "contributor" } }),
      };
    }

    if (url.includes("page=2")) {
      return {
        ok: true,
        json: async () => [review("maintainer", "CHANGES_REQUESTED")],
      };
    }

    return {
      ok: true,
      json: async () => firstPage,
    };
  };

  try {
    assert.equal(
      await checkPullRequestApproval({
        apiBase: "https://github.example.test",
        repository: "owner/repository",
        pullNumber: 15,
        token: "token",
      }),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fails closed for missing GitHub context and API failures", async () => {
  await assert.rejects(
    checkPullRequestApproval({ repository: "owner/repository", pullNumber: 15 }),
    /GITHUB_TOKEN/,
  );
  await assert.rejects(checkPullRequestApproval({ token: "token" }), /GITHUB_REPOSITORY/);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    text: async () => "failure",
  });

  try {
    await assert.rejects(
      checkPullRequestApproval({
        repository: "owner/repository",
        pullNumber: 15,
        token: "token",
      }),
      /GitHub API \/pulls\/15 failed \(500\): failure/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
