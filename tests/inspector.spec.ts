import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Inspector } from "../src";
import { Session } from "node:inspector/promises";
import { writeFileSync } from "node:fs";

vi.mock("node:inspector/promises", () => ({
    Session: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        post: vi.fn(),
    })),
}));

vi.mock("node:fs", () => ({
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

describe("Inspector", () => {
    let sessionMock: any;

    beforeEach(() => {
        sessionMock = new (require("node:inspector/promises").Session)();
        vi.spyOn(sessionMock, "connect");
        vi.spyOn(sessionMock, "disconnect");
        vi.spyOn(sessionMock, "post");
        vi.spyOn(Inspector, "getInstance").mockReturnValue({
            session: sessionMock,
            profile: null,
            started: false,
        } as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should bind to process kill signals and stop the inspector", async () => {
        const mockStop = vi.spyOn(Inspector, "stop").mockImplementation(() => Promise.resolve());

        await Inspector.bindKillProcess();

        process.emit("SIGINT");
        expect(mockStop).toHaveBeenCalled();
    });

    it("should save the profile to the specified directory", async () => {
        const dirName = "/mock/dir";
        const mockProfile = { data: "mockProfile" };
        //@ts-ignore
        Inspector.getInstance().profile = mockProfile;

        await Inspector.saveProfile(dirName);

        expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(dirName),
        JSON.stringify(mockProfile)
        );
    });

    it("should restart the inspector after saving the profile", async () => {
        const startSpy = vi.spyOn(Inspector, "start").mockImplementation(() => Promise.resolve());
        const dirName = "/mock/dir";

        await Inspector.saveProfile(dirName, true);

        expect(startSpy).toHaveBeenCalled();
    });

    it("should not restart the inspector if restart is false", async () => {
        const startSpy = vi.spyOn(Inspector, "start").mockImplementation(() => Promise.resolve());
        const dirName = "/mock/dir";

        await Inspector.saveProfile(dirName, false);

        expect(startSpy).not.toHaveBeenCalled();
    });
        
    it("should not stop if the profiler was not started", async () => {
        Inspector.getInstance().started = false;
    
        await Inspector.stop();
    
        expect(sessionMock.post).not.toHaveBeenCalled();
        expect(sessionMock.disconnect).not.toHaveBeenCalled();
    });
    
    it("should handle invalid profile data gracefully when stopping", async () => {
        sessionMock.post.mockResolvedValueOnce({});
        await Inspector.stop();
        expect(Inspector.getInstance().profile).toBeNull();
    });
    
    it("should correctly handle multiple signals for process kill", async () => {
        const stopSpy = vi.spyOn(Inspector, "stop").mockImplementation(() => Promise.resolve());
    
        await Inspector.bindKillProcess();
    
        process.emit("SIGTERM");
        process.emit("SIGINT");
    
        expect(stopSpy).toHaveBeenCalledTimes(3);
    });
    
});
