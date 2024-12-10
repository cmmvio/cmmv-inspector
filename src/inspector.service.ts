import * as fs from 'node:fs';
import { join } from 'node:path';
import { Session, Profiler } from 'node:inspector/promises';
import { Logger, Singleton } from '@cmmv/core';

export class Inspector extends Singleton {
    public static logger: Logger = new Logger('Inspector');
    public started: boolean = false;
    public session: Session;
    public profile: Profiler.Profile;
    private static finalizationCallbacks: Array<() => Promise<void>> = [];

    public static async start() {
        const instance = Inspector.getInstance();
        instance.started = true;
        instance.session = new Session();
        instance.session.connect();
        await instance.session.post('Profiler.enable');
        await instance.session.post('Profiler.start');
    }

    public static async pause() {
        const instance = Inspector.getInstance();
        await instance.session.post('Debugger.pause');
    }

    public static async stop() {
        const instance = Inspector.getInstance();

        if (instance.started && instance.session) {
            instance.started = false;
            try {
                const result = await instance.session.post('Profiler.stop');

                if (!result || !result.profile)
                    throw new Error('Profiler.stop did not return a profile');

                instance.profile = result.profile;
                instance.session.disconnect();
            } catch (e) {
                Inspector.logger.error(e);
            }
        }
    }

    public static bindKillProcess() {
        ['uncaughtException', 'beforeExit', 'SIGINT', 'SIGTERM'].forEach(
            event => {
                process.once(event, async () => {
                    for (const callback of this.finalizationCallbacks) {
                        try {
                            await callback();
                        } catch (e) {
                            Inspector.logger.error(
                                `Error during finalization callback: ${e}`,
                            );
                        }
                    }

                    await Inspector.stop();

                    if (process.env.NODE_ENV !== 'test') process.exit(0);
                });
            },
        );
    }

    public static once(finalizationCallback: () => Promise<void>) {
        this.finalizationCallbacks.push(finalizationCallback);
    }

    public static async saveProfile(dirName: string, restart: boolean = true) {
        const instance = Inspector.getInstance();

        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }

        if (!instance.profile) {
            await Inspector.stop();
        }

        fs.writeFileSync(
            join(dirName, `cpu-profile-${new Date().toISOString()}.cpuprofile`),
            JSON.stringify(instance.profile),
        );

        if (restart) {
            Inspector.start();
        }
    }

    public static async takeHeapSnapshot(dirName: string) {
        const instance = Inspector.getInstance();

        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }

        const filePath = join(
            dirName,
            `heap-${new Date().toISOString()}.heapsnapshot`,
        );
        const fileStream = fs.createWriteStream(filePath);

        instance.session = new Session();
        instance.session.connect();

        try {
            await instance.session.post('HeapProfiler.enable');
            const result = await instance.session.post(
                'HeapProfiler.takeHeapSnapshot',
                null,
            );
            Inspector.logger.log(
                `HeapProfiler.takeHeapSnapshot done: ${result}`,
            );

            await new Promise((resolve, reject) => {
                instance.session.on('HeapProfiler.addHeapSnapshotChunk', m => {
                    fileStream.write(m.params.chunk);
                });

                instance.session.once(
                    'HeapProfiler.heapSnapshotProgress',
                    ({ done }) => {
                        if (done) {
                            fileStream.end();
                            resolve(undefined);
                        }
                    },
                );

                instance.session.once('error', reject);
            });

            Inspector.logger.log(`Heap snapshot saved to ${filePath}`);
        } catch (e) {
            Inspector.logger.error(`Error while taking heap snapshot: ${e}`);
        } finally {
            instance.session.disconnect();
        }
    }
}
