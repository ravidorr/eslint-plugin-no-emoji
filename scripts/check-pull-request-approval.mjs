import { fileURLToPath } from "node:url";

export function hasValidApproval({ reviews, authorLogin, repositoryOwnerLogin }) {
  if (
    authorLogin &&
    repositoryOwnerLogin &&
    authorLogin.toLowerCase() === repositoryOwnerLogin.toLowerCase()
  ) {
    return true;
  }

  const latestReviewByUser = new Map();

  for (const review of reviews) {
    if (!review.user?.login || review.state === "PENDING") {
      continue;
    }

    latestReviewByUser.set(review.user.login, review.state);
  }

  return [...latestReviewByUser.entries()].some(
    ([login, state]) => state === "APPROVED" && login !== authorLogin,
  );
}

async function github({ apiBase, repository, token }, path) {
  const response = await fetch(`${apiBase}/repos/${repository}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${path} failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function checkPullRequestApproval({
  apiBase = "https://api.github.com",
  repository,
  pullNumber,
  token,
}) {
  if (!token) {
    throw new Error("GITHUB_TOKEN is required to verify pull request approval.");
  }

  if (!repository || !pullNumber) {
    throw new Error("GITHUB_REPOSITORY and PULL_NUMBER are required.");
  }

  const [repositoryOwnerLogin] = repository.split("/", 1);

  if (!repositoryOwnerLogin) {
    throw new Error("GITHUB_REPOSITORY must include the repository owner.");
  }

  const client = { apiBase, repository, token };
  const pull = await github(client, `/pulls/${pullNumber}`);
  const reviews = await github(client, `/pulls/${pullNumber}/reviews`);

  return hasValidApproval({
    reviews,
    authorLogin: pull.user?.login,
    repositoryOwnerLogin,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const hasApproval = await checkPullRequestApproval({
      apiBase: process.env.GITHUB_API_URL ?? "https://api.github.com",
      repository: process.env.GITHUB_REPOSITORY,
      pullNumber: process.env.PULL_NUMBER,
      token: process.env.GITHUB_TOKEN,
    });

    if (!hasApproval) {
      console.error(
        "Publishing requires an approving review from someone other than the pull request author, unless the author owns the repository.",
      );
      process.exit(1);
    }

    process.stdout.write("Pull request satisfies the publishing approval policy.\n");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
