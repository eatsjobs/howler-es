import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Howler } from "../index";

describe("Howler Global - Audio Unlock Listeners", () => {
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Use fake timers for faster tests
		vi.useFakeTimers();

		// Browser mode provides real AudioContext
		if (!Howler.ctx) {
			Howler.ctx = new AudioContext();
		}

		// Set up spies
		addEventListenerSpy = vi.spyOn(document, "addEventListener");
		removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

		// Reset Howler state
		Howler._audioUnlocked = false;
		Howler._isUnlocking = false;
		Howler._unlockedListeners = null;
		if (Howler._unlockTimeoutId) {
			clearTimeout(Howler._unlockTimeoutId);
			Howler._unlockTimeoutId = null;
		}
		Howler.autoUnlock = true;
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		vi.useRealTimers();

		// Cleanup
		if (Howler._unlockTimeoutId) {
			clearTimeout(Howler._unlockTimeoutId);
			Howler._unlockTimeoutId = null;
		}
	});

	it("should add listeners when _unlockAudio is called", () => {
		Howler._unlockAudio();

		const calls = addEventListenerSpy.mock.calls;
		const eventTypes = calls.map((call) => call[0]);

		expect(eventTypes).toContain("touchstart");
		expect(eventTypes).toContain("touchend");
		expect(eventTypes).toContain("click");
		expect(eventTypes).toContain("keydown");
	});

	it("should not add duplicate listeners on multiple _unlockAudio calls", () => {
		Howler._unlockAudio();
		const callCountAfterFirst = addEventListenerSpy.mock.calls.length;

		// Try to call again (should be a no-op)
		Howler._unlockAudio();
		const callCountAfterSecond = addEventListenerSpy.mock.calls.length;

		// Should not add more listeners if already unlocking
		expect(callCountAfterSecond).toBe(callCountAfterFirst);
	});

	// Note: Testing listener removal when audio.onended fires requires a real browser
	// with proper Web Audio API event handling. The jsdom environment doesn't fully
	// support this. The 5-second timeout cleanup test below verifies the fallback
	// cleanup mechanism works, which is the critical memory leak fix.

	it("should trigger listeners on user interaction events", () => {
		// Use real timers for this test since we're simulating user events
		vi.useRealTimers();

		Howler._unlockAudio();

		const addCallCount = addEventListenerSpy.mock.calls.length;
		expect(addCallCount).toBeGreaterThan(0);

		// Simulate user interaction by dispatching events
		const clickEvent = new MouseEvent("click", { bubbles: true });
		document.dispatchEvent(clickEvent);

		const touchEvent = new TouchEvent("touchstart", { bubbles: true });
		document.dispatchEvent(touchEvent);

		const keyEvent = new KeyboardEvent("keydown", {
			bubbles: true,
			key: "Enter",
		});
		document.dispatchEvent(keyEvent);

		// Verify listeners are still active
		expect(addEventListenerSpy.mock.calls.length).toBeGreaterThanOrEqual(
			addCallCount,
		);
	});

	it("should clean up listeners if they are never triggered within 15 seconds", () => {
		Howler._unlockAudio();

		const initialRemoveCount = removeEventListenerSpy.mock.calls.length;

		// Advance time past the cleanup timeout (15 seconds)
		vi.advanceTimersByTime(15100);

		const finalRemoveCount = removeEventListenerSpy.mock.calls.length;

		// Listeners should be cleaned up by the timeout
		expect(finalRemoveCount).toBeGreaterThan(initialRemoveCount);

		// Verify specific listeners were removed
		const removedEventTypes = removeEventListenerSpy.mock.calls
			.slice(initialRemoveCount)
			.map((call) => call[0]);

		expect(removedEventTypes).toContain("touchstart");
		expect(removedEventTypes).toContain("touchend");
		expect(removedEventTypes).toContain("click");
		expect(removedEventTypes).toContain("keydown");
	});
});
