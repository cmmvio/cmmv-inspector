import * as fs from "node:fs";
import { join } from "node:path";
import { Session, Profiler } from "node:inspector/promises";
import { Logger, Singleton } from '@cmmv/core';

export class Inspector extends Singleton {
    public static logger: Logger = new Logger('Inspector');
    public started: boolean = false;
    public session: Session;
    public profile: Profiler.Profile;
    
    public static async start(){
        const instance = Inspector.getInstance();
        instance.started = true;
        instance.session = new Session();
        instance.session.connect();
        await instance.session.post("Profiler.enable");
        await instance.session.post("Profiler.start");
    }

    public static async pause(){
        const instance = Inspector.getInstance();
        await instance.session.post("Debugger.pause");
    }

    public static async stop() {
        const instance = Inspector.getInstance();
        instance.started = false;

        if (instance.started && instance.session) {
            try {
                const result = await instance.session.post("Profiler.stop");

                if (!result || !result.profile) 
                    throw new Error("Profiler.stop did not return a profile");
                
                instance.profile = result.profile;
                instance.session.disconnect();                
            } catch (e) {
                Inspector.logger.error(e);
            }
        }
    }    

    public static bindKillProcess() {
        ["uncaughtException", "beforeExit", "SIGINT", "SIGTERM"].forEach((event) => {
            process.once(event, async () => {
                await Inspector.stop();

                if (process.env.NODE_ENV !== "test") 
                    process.exit(0);
            });
        });
    }    

    public static async saveProfile(dirName: string, restart: boolean = true){
        const instance = Inspector.getInstance();

        if(!fs.existsSync(dirName))
            fs.mkdirSync(dirName, { recursive: true });

        if(!instance.profile)
            await Inspector.stop();

        await fs.writeFileSync(
            join(dirName, `cpu-profile-${new Date()}.cpuprofile`), 
            JSON.stringify(instance.profile)
        );

        if(restart)
            Inspector.start();
    }
}
