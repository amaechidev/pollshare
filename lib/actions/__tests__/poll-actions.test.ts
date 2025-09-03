// lib/actions/__tests__/poll-actions.test.ts
import { headers } from "next/headers"; // Import headers for mocking
import { deletePoll, voteOnPoll } from "../poll-actions"; // Added voteOnPoll
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/// Mock the Supabase client and its methods
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(), // Mock createClient itself
}));

// Mock Next.js headers
jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Headers()), // Return a mock Headers object
}));

// Mock Next.js cache revalidation
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock Next.js navigation redirect
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Helper to create a fresh set of chainable query builder mocks
const createMockQueryBuilder = () => {
  const mockDeleteMethods = {
    eq: jest.fn().mockReturnThis(),
  };

  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    delete: jest.fn(() => mockDeleteMethods), // delete returns mockDeleteMethods
    insert: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    _mockDeleteMethods: mockDeleteMethods,
  };
  return queryBuilder;
};

// Global aliases for main mocks that are set up in beforeEach
let mockCreateClient: jest.Mock;
let mockGetUser: jest.Mock;
let mockFrom: jest.Mock;
let mockRpc: jest.Mock;
let mockRevalidatePath: jest.Mock;
let mockHeaders: jest.Mock;

describe("deletePoll", () => {
  const POLLER_USER_ID = "test-creator-id";
  const OTHER_USER_ID = "other-user-id";
  const POLL_ID = "test-poll-id";

  let deletePollQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockDeleteEq: jest.Mock; // Declare mockDeleteEq here, specific to deletePoll's delete chain

  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateClient = createClient as jest.Mock;
    mockGetUser = jest.fn();
    mockRpc = jest.fn();
    mockRevalidatePath = revalidatePath as jest.Mock;
    mockHeaders = headers as jest.Mock;

    deletePollQueryBuilder = createMockQueryBuilder();
    // Capture the mockDeleteMethods.eq instance from the specific query builder for deletePoll tests
    mockDeleteEq = deletePollQueryBuilder._mockDeleteMethods.eq as jest.Mock;

    mockFrom = jest.fn(() => deletePollQueryBuilder); // `from` always returns this specific mock

    mockCreateClient.mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      rpc: mockRpc,
    });

    mockHeaders.mockReturnValue(
      new Headers({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Jest Test User-Agent",
      })
    );
  });

  it("should successfully delete a poll if the user is the creator", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: POLLER_USER_ID } },
      error: null,
    });
    deletePollQueryBuilder.single.mockResolvedValueOnce({
      data: { creator_id: POLLER_USER_ID },
      error: null,
    });
    mockDeleteEq.mockResolvedValueOnce({ error: null }); // Use the captured mockDeleteEq

    const result = await deletePoll(POLL_ID);

    expect(result).toEqual({ success: true });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("polls");
    expect(deletePollQueryBuilder.select).toHaveBeenCalledWith("creator_id");
    expect(deletePollQueryBuilder.eq).toHaveBeenCalledWith("id", POLL_ID);
    expect(deletePollQueryBuilder.single).toHaveBeenCalledTimes(1);

    expect(deletePollQueryBuilder.delete).toHaveBeenCalledTimes(1); // Now this should be 1
    expect(mockDeleteEq).toHaveBeenCalledWith("id", POLL_ID); // Use the captured mockDeleteEq for assertion
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should return an error if the user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth error" },
    });

    const result = await deletePoll(POLL_ID);

    expect(result).toEqual({
      success: false,
      error: "User not authenticated.",
    });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if the poll is not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: POLLER_USER_ID } },
      error: null,
    });
    deletePollQueryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Poll not found" },
    });

    const result = await deletePoll(POLL_ID);

    expect(result).toEqual({
      success: false,
      error: "Poll not found or unauthorized access.",
    });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("polls");
    expect(deletePollQueryBuilder.select).toHaveBeenCalledWith("creator_id");
    expect(deletePollQueryBuilder.eq).toHaveBeenCalledWith("id", POLL_ID);
    expect(deletePollQueryBuilder.single).toHaveBeenCalledTimes(1);
    expect(deletePollQueryBuilder.delete).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if the user is not the creator of the poll", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: OTHER_USER_ID } },
      error: null,
    });
    deletePollQueryBuilder.single.mockResolvedValueOnce({
      data: { creator_id: POLLER_USER_ID },
      error: null,
    });

    const result = await deletePoll(POLL_ID);

    expect(result).toEqual({
      success: false,
      error: "Unauthorized: You are not the creator of this poll.",
    });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("polls");
    expect(deletePollQueryBuilder.select).toHaveBeenCalledWith("creator_id");
    expect(deletePollQueryBuilder.eq).toHaveBeenCalledWith("id", POLL_ID);
    expect(deletePollQueryBuilder.single).toHaveBeenCalledTimes(1);
    expect(deletePollQueryBuilder.delete).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if Supabase deletion fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: POLLER_USER_ID } },
      error: null,
    });
    deletePollQueryBuilder.single.mockResolvedValueOnce({
      data: { creator_id: POLLER_USER_ID },
      error: null,
    });
    mockDeleteEq.mockResolvedValueOnce({
      error: { message: "DB delete error" },
    }); // Use the captured mockDeleteEq

    const result = await deletePoll(POLL_ID);

    expect(result).toEqual({ success: false, error: "DB delete error" });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("polls");
    expect(deletePollQueryBuilder.select).toHaveBeenCalledWith("creator_id");
    expect(deletePollQueryBuilder.eq).toHaveBeenCalledWith("id", POLL_ID);
    expect(deletePollQueryBuilder.single).toHaveBeenCalledTimes(1);
    expect(deletePollQueryBuilder.delete).toHaveBeenCalledTimes(1); // Now this should be 1
    expect(mockDeleteEq).toHaveBeenCalledWith("id", POLL_ID); // Use the captured mockDeleteEq for assertion
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("voteOnPoll", () => {
  const POLL_ID = "vote-poll-id";
  const OPTION_ID = "vote-option-id";
  const AUTHENTICATED_USER_ID = "authenticated-user-id";
  const ANONYMOUS_FINGERPRINT = "anon-fingerprint-123";

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset global mocks
    mockCreateClient = createClient as jest.Mock;
    mockGetUser = jest.fn();
    mockRpc = jest.fn();
    mockRevalidatePath = revalidatePath as jest.Mock;
    mockHeaders = headers as jest.Mock;

    // Use a mock implementation for `from` that returns *distinct* query builders
    // for each call to from() within a test.
    mockFrom = jest.fn((tableName: string) => {
      const queryBuilder = createMockQueryBuilder();
      // It's helpful to know which table is being queried for debugging, though not strictly necessary for this mock's behavior.
      return queryBuilder;
    });

    mockCreateClient.mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      rpc: mockRpc,
    });

    mockHeaders.mockReturnValue(
      new Headers({
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Jest Test User-Agent",
      })
    );
  });

  it("should successfully record an authenticated vote", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: AUTHENTICATED_USER_ID } },
      error: null,
    });

    // Mock the query builder instances in the order they are called
    const pollsQuery = createMockQueryBuilder();
    const votesQuery = createMockQueryBuilder();
    const insertVoteQuery = createMockQueryBuilder(); // For the insert call

    mockFrom.mockReturnValueOnce(pollsQuery); // First from('polls')
    mockFrom.mockReturnValueOnce(votesQuery); // Second from('votes')
    mockFrom.mockReturnValueOnce(insertVoteQuery); // Third from('votes').insert

    // Configure specific mocks for the first query (poll details)
    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    // Configure specific mocks for the second query (existing vote check)
    votesQuery.select.mockReturnThis();
    votesQuery.eq.mockReturnThis();
    votesQuery.or.mockReturnThis();
    votesQuery.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    }); // No existing vote

    // Configure specific mocks for the insert call
    insertVoteQuery.insert.mockResolvedValueOnce({ error: null });

    // Mock rpc calls
    mockRpc.mockResolvedValueOnce({ error: null }); // increment_option_vote_count
    mockRpc.mockResolvedValueOnce({ error: null }); // increment_poll_vote_count

    const result = await voteOnPoll(POLL_ID, OPTION_ID);

    expect(result).toEqual({ success: true });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockHeaders).toHaveBeenCalledTimes(1);

    // Assertions for polls query
    expect(mockFrom).toHaveBeenCalledWith("polls");
    expect(pollsQuery.select).toHaveBeenCalledWith("is_active, is_public");
    expect(pollsQuery.eq).toHaveBeenCalledWith("id", POLL_ID);
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);

    // Assertions for votes query (check existing vote)
    expect(mockFrom).toHaveBeenCalledWith("votes");
    expect(votesQuery.select).toHaveBeenCalledWith("id");
    expect(votesQuery.eq).toHaveBeenCalledWith("poll_id", POLL_ID);
    expect(votesQuery.or).toHaveBeenCalledWith(
      `voter_id.eq.${AUTHENTICATED_USER_ID},voter_fingerprint.eq.${AUTHENTICATED_USER_ID}`
    );
    expect(votesQuery.single).toHaveBeenCalledTimes(1);

    // Assertions for vote insertion
    expect(insertVoteQuery.insert).toHaveBeenCalledWith({
      poll_id: POLL_ID,
      poll_option_id: OPTION_ID,
      voter_id: AUTHENTICATED_USER_ID,
      voter_fingerprint: AUTHENTICATED_USER_ID,
      voter_ip: "192.168.1.1",
      user_agent: "Jest Test User-Agent",
    });

    // Assertions for rpc calls
    expect(mockRpc).toHaveBeenCalledWith("increment_option_vote_count", {
      option_id: OPTION_ID,
    });
    expect(mockRpc).toHaveBeenCalledWith("increment_poll_vote_count", {
      p_id: POLL_ID,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${POLL_ID}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should successfully record an anonymous vote with fingerprint", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const pollsQuery = createMockQueryBuilder();
    const votesQuery = createMockQueryBuilder();
    const insertVoteQuery = createMockQueryBuilder();

    mockFrom.mockReturnValueOnce(pollsQuery);
    mockFrom.mockReturnValueOnce(votesQuery);
    mockFrom.mockReturnValueOnce(insertVoteQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    votesQuery.select.mockReturnThis();
    votesQuery.eq.mockReturnThis();
    votesQuery.or.mockReturnThis();
    votesQuery.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    insertVoteQuery.insert.mockResolvedValueOnce({ error: null });

    mockRpc.mockResolvedValueOnce({ error: null });
    mockRpc.mockResolvedValueOnce({ error: null });

    const result = await voteOnPoll(POLL_ID, OPTION_ID, ANONYMOUS_FINGERPRINT);

    expect(result).toEqual({ success: true });
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("polls");
    expect(pollsQuery.select).toHaveBeenCalledWith("is_active, is_public");
    expect(pollsQuery.eq).toHaveBeenCalledWith("id", POLL_ID);
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);

    expect(mockFrom).toHaveBeenCalledWith("votes");
    expect(votesQuery.select).toHaveBeenCalledWith("id");
    expect(votesQuery.eq).toHaveBeenCalledWith("poll_id", POLL_ID);
    expect(votesQuery.or).toHaveBeenCalledWith(
      `voter_id.eq.null,voter_fingerprint.eq.${ANONYMOUS_FINGERPRINT}`
    );
    expect(votesQuery.single).toHaveBeenCalledTimes(1);

    expect(insertVoteQuery.insert).toHaveBeenCalledWith({
      poll_id: POLL_ID,
      poll_option_id: OPTION_ID,
      voter_id: null,
      voter_fingerprint: ANONYMOUS_FINGERPRINT,
      voter_ip: "192.168.1.1",
      user_agent: "Jest Test User-Agent",
    });
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${POLL_ID}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should return an error if missing voter identifier for anonymous vote", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const pollsQuery = createMockQueryBuilder();
    mockFrom.mockReturnValueOnce(pollsQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    const result = await voteOnPoll(POLL_ID, OPTION_ID, null); // No fingerprint

    expect(result).toEqual({
      success: false,
      error: "Missing voter identifier for anonymous vote.",
    });
    expect(mockFrom).toHaveBeenCalledTimes(1); // Only for polls
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);
    expect(mockFrom().insert).not.toHaveBeenCalled(); // No insert happens
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if user has already voted (authenticated)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: AUTHENTICATED_USER_ID } },
      error: null,
    });

    const pollsQuery = createMockQueryBuilder();
    const votesQuery = createMockQueryBuilder();

    mockFrom.mockReturnValueOnce(pollsQuery);
    mockFrom.mockReturnValueOnce(votesQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    // Mock existing vote check (found existing vote)
    votesQuery.select.mockReturnThis();
    votesQuery.eq.mockReturnThis();
    votesQuery.or.mockReturnThis();
    votesQuery.single.mockResolvedValueOnce({
      data: { id: "existing-vote-id" },
      error: null,
    });

    const result = await voteOnPoll(POLL_ID, OPTION_ID);

    expect(result).toEqual({
      success: false,
      error: "You have already voted on this poll.",
    });
    expect(mockFrom).toHaveBeenCalledTimes(2); // polls and votes
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);
    expect(votesQuery.single).toHaveBeenCalledTimes(1);
    expect(mockFrom().insert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if user has already voted (anonymous)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const pollsQuery = createMockQueryBuilder();
    const votesQuery = createMockQueryBuilder();

    mockFrom.mockReturnValueOnce(pollsQuery);
    mockFrom.mockReturnValueOnce(votesQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    // Mock existing vote check (found existing vote)
    votesQuery.select.mockReturnThis();
    votesQuery.eq.mockReturnThis();
    votesQuery.or.mockReturnThis();
    votesQuery.single.mockResolvedValueOnce({
      data: { id: "existing-vote-id" },
      error: null,
    });

    const result = await voteOnPoll(POLL_ID, OPTION_ID, ANONYMOUS_FINGERPRINT);

    expect(result).toEqual({
      success: false,
      error: "You have already voted on this poll.",
    });
    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);
    expect(votesQuery.single).toHaveBeenCalledTimes(1);
    expect(mockFrom().insert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if poll is not found for voting", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: AUTHENTICATED_USER_ID } },
      error: null,
    });

    const pollsQuery = createMockQueryBuilder();
    mockFrom.mockReturnValueOnce(pollsQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Poll not found" },
    });

    const result = await voteOnPoll(POLL_ID, OPTION_ID);

    expect(result).toEqual({ success: false, error: "Poll not found." });
    expect(mockFrom).toHaveBeenCalledTimes(1); // Only polls query is made
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);
    expect(mockFrom().insert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if poll is not active", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: AUTHENTICATED_USER_ID } },
      error: null,
    });

    const pollsQuery = createMockQueryBuilder();
    mockFrom.mockReturnValueOnce(pollsQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: false, is_public: true },
      error: null,
    }); // Poll is inactive

    const result = await voteOnPoll(POLL_ID, OPTION_ID);

    expect(result).toEqual({
      success: false,
      error: "This poll is not active.",
    });
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);
    expect(mockFrom().insert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if vote insertion fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: AUTHENTICATED_USER_ID } },
      error: null,
    });

    const pollsQuery = createMockQueryBuilder();
    const votesQuery = createMockQueryBuilder();
    const insertVoteQuery = createMockQueryBuilder();

    mockFrom.mockReturnValueOnce(pollsQuery);
    mockFrom.mockReturnValueOnce(votesQuery);
    mockFrom.mockReturnValueOnce(insertVoteQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    votesQuery.select.mockReturnThis();
    votesQuery.eq.mockReturnThis();
    votesQuery.or.mockReturnThis();
    votesQuery.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    // Simulate insert failure
    insertVoteQuery.insert.mockResolvedValueOnce({
      error: { message: "Insert failed" },
    });

    const result = await voteOnPoll(POLL_ID, OPTION_ID);

    expect(result).toEqual({ success: false, error: "Insert failed" }); // Expect specific error message
    expect(mockFrom).toHaveBeenCalledTimes(3);
    expect(pollsQuery.single).toHaveBeenCalledTimes(1);
    expect(votesQuery.single).toHaveBeenCalledTimes(1);
    expect(insertVoteQuery.insert).toHaveBeenCalledTimes(1);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if increment_option_vote_count fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: AUTHENTICATED_USER_ID } },
      error: null,
    });

    const pollsQuery = createMockQueryBuilder();
    const votesQuery = createMockQueryBuilder();
    const insertVoteQuery = createMockQueryBuilder();

    mockFrom.mockReturnValueOnce(pollsQuery);
    mockFrom.mockReturnValueOnce(votesQuery);
    mockFrom.mockReturnValueOnce(insertVoteQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    votesQuery.select.mockReturnThis();
    votesQuery.eq.mockReturnThis();
    votesQuery.or.mockReturnThis();
    votesQuery.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    insertVoteQuery.insert.mockResolvedValueOnce({ error: null }); // Insert succeeds

    mockRpc.mockResolvedValueOnce({ error: { message: "RPC option error" } }); // Simulate RPC error

    const result = await voteOnPoll(POLL_ID, OPTION_ID);

    expect(result).toEqual({
      success: false,
      error: "Failed to update option vote count.",
    });
    expect(mockRpc).toHaveBeenCalledWith("increment_option_vote_count", {
      option_id: OPTION_ID,
    });
    expect(mockRpc).toHaveBeenCalledTimes(1); // Only the first RPC was called
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error if increment_poll_vote_count fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: AUTHENTICATED_USER_ID } },
      error: null,
    });

    const pollsQuery = createMockQueryBuilder();
    const votesQuery = createMockQueryBuilder();
    const insertVoteQuery = createMockQueryBuilder();

    mockFrom.mockReturnValueOnce(pollsQuery);
    mockFrom.mockReturnValueOnce(votesQuery);
    mockFrom.mockReturnValueOnce(insertVoteQuery);

    pollsQuery.select.mockReturnThis();
    pollsQuery.eq.mockReturnThis();
    pollsQuery.single.mockResolvedValueOnce({
      data: { is_active: true, is_public: true },
      error: null,
    });

    votesQuery.select.mockReturnThis();
    votesQuery.eq.mockReturnThis();
    votesQuery.or.mockReturnThis();
    votesQuery.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    insertVoteQuery.insert.mockResolvedValueOnce({ error: null }); // Insert succeeds
    mockRpc.mockResolvedValueOnce({ error: null }); // First RPC succeeds
    mockRpc.mockResolvedValueOnce({ error: { message: "RPC poll error" } }); // Second RPC fails

    const result = await voteOnPoll(POLL_ID, OPTION_ID);

    expect(result).toEqual({
      success: false,
      error: "Failed to update poll vote count.",
    });
    expect(mockRpc).toHaveBeenCalledWith("increment_poll_vote_count", {
      p_id: POLL_ID,
    });
    expect(mockRpc).toHaveBeenCalledTimes(2); // Both RPCs were attempted
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
