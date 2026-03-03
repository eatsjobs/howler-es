import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Howl, Howler } from "../index";
import { SpatialAudioPlugin } from "../plugins/spatial";

describe("Spatial Audio Plugin - Panner Node Cleanup", () => {
	let spatialPlugin: SpatialAudioPlugin;

	beforeEach(() => {
		// Initialize audio context
		if (!Howler.ctx) {
			Howler.ctx = new AudioContext();
		}

		// Register spatial plugin
		spatialPlugin = new SpatialAudioPlugin();
		Howler.addPlugin(spatialPlugin);
	});

	afterEach(() => {
		// Unregister plugin
		Howler.removePlugin(spatialPlugin);
		// Stop all sounds
		Howler.stop();
	});

	it("should create and play sounds with spatial audio", async () => {
		const sound = new Howl({
			src: [
				"data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
			],
			pos: [10, 5, 0],
		});

		expect(sound).toBeDefined();
		const soundId = sound.play();
		expect(soundId).not.toBeNull();

		// Give time for playback to start
		await new Promise((resolve) => setTimeout(resolve, 100));

		sound.stop();
	});

	it("should allow multiple spatial sounds to exist simultaneously", async () => {
		const sounds: Howl[] = [];
		for (let i = 0; i < 5; i++) {
			const sound = new Howl({
				src: [
					"data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
				],
				pos: [i * 10, 0, 0],
			});
			sounds.push(sound);
			sound.play();
		}

		await new Promise((resolve) => setTimeout(resolve, 50));

		// All sounds should be in the _sounds array
		const firstSound = sounds[0];
		expect(firstSound._sounds.length).toBeGreaterThan(0);

		// Stop and drain
		Howler.stop();
	});

	it("should allow sound recreation after draining", async () => {
		// Create and play multiple sounds to trigger pool draining
		const sounds: Howl[] = [];
		for (let i = 0; i < 10; i++) {
			const sound = new Howl({
				src: [
					"data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
				],
				pos: [i * 5, 0, 0],
				volume: 0, // Mute to avoid audio issues
			});
			sounds.push(sound);
		}

		// Play all sounds
		sounds.forEach((sound) => {
			sound.play();
		});
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Stop all
		Howler.stop();

		// Now create a new sound - should work without errors
		const newSound = new Howl({
			src: [
				"data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
			],
			pos: [0, 0, 0],
		});

		const soundId = newSound.play();
		expect(soundId).not.toBeNull();

		newSound.stop();
	});

	it("should maintain audio context state after multiple sound cycles", async () => {
		const audioContext = Howler.ctx!;
		const initialState = audioContext.state;

		// Create, play, and stop sounds multiple times
		for (let cycle = 0; cycle < 3; cycle++) {
			const sounds: Howl[] = [];
			for (let i = 0; i < 5; i++) {
				const sound = new Howl({
					src: [
						"data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
					],
					pos: [i * 10, 0, 0],
					volume: 0,
				});
				sounds.push(sound);
				sound.play();
			}

			await new Promise((resolve) => setTimeout(resolve, 50));
			Howler.stop();
		}

		// Audio context should still be in a valid state
		expect(audioContext.state).toBe(initialState);
	});

	it("should handle spatial audio after creating many sounds", async () => {
		// Create a Howl instance that will trigger sound pooling
		const sound = new Howl({
			src: [
				"data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
			],
			volume: 0,
		});

		// Create many sounds in sequence (this will cause pool draining)
		for (let i = 0; i < 15; i++) {
			const id = sound.play();
			expect(id).not.toBeNull();
			sound.stop(id);
		}

		// Should still be able to use spatial methods after draining
		sound.pos(5, 5, 5);

		// Verify the sound still works
		const finalId = sound.play();
		expect(finalId).not.toBeNull();
	});

	it("should not throw errors when stopping sounds after spatial audio setup", async () => {
		const sound = new Howl({
			src: [
				"data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
			],
			pos: [10, 0, 0],
			volume: 0,
		});

		const soundIds = [];
		for (let i = 0; i < 5; i++) {
			const id = sound.play();
			soundIds.push(id);
		}

		await new Promise((resolve) => setTimeout(resolve, 50));

		// This should not throw
		expect(() => {
			soundIds.forEach((id) => {
				if (id !== null) {
					sound.stop(id);
				}
			});
		}).not.toThrow();
	});
});
