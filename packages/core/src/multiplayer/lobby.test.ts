import { describe, expect, it } from "vitest";
import {
  seatsChosenForGame,
  shouldAutoStartGame,
  type LobbyState,
} from "./protocol.js";

describe("lobby start conditions", () => {
  const base: LobbyState = {
    playerCount: 2,
    hostSeatChoice: "white",
    guestSeatChoice: "black",
    hostReady: false,
    guestReady: false,
  };

  it("seatsChosenForGame when different sides picked", () => {
    expect(seatsChosenForGame(base)).toBe(true);
  });

  it("rejects same side", () => {
    expect(
      seatsChosenForGame({ ...base, guestSeatChoice: "white" }),
    ).toBe(false);
  });

  it("auto start only when both ready", () => {
    expect(shouldAutoStartGame(base)).toBe(false);
    expect(
      shouldAutoStartGame({ ...base, hostReady: true, guestReady: true }),
    ).toBe(true);
    expect(
      shouldAutoStartGame({ ...base, hostReady: true, guestReady: false }),
    ).toBe(false);
  });
});
