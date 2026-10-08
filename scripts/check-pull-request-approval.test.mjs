import assert from "node:assert/strict";
import test from "node:test";

import { hasValidApproval } from "./check-pull-request-approval.mjs";

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
      authorLogin: "contributor",
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
