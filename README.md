<p align="center">
  <a href="https://cmmv.io/" target="blank"><img src="https://raw.githubusercontent.com/andrehrferreira/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png" width="300" alt="CMMV Logo" /></a>
</p>
<p align="center">Contract-Model-Model-View (CMMV) <br/> Building scalable and modular applications using contracts.</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@cmmv/inspector"><img src="https://img.shields.io/npm/v/@cmmv/inspector.svg" alt="NPM Version" /></a>
    <a href="https://github.com/andrehrferreira/cmmv-server/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cmmv/core.svg" alt="Package License" /></a>
</p>

<p align="center">
  <a href="https://cmmv.io">Documentation</a> &bull;
  <a href="https://github.com/andrehrferreira/cmmv-server/issues">Report Issue</a>
</p>

## Description

The `@cmmv/inspector` module provides tools for runtime performance profiling and debugging for Node.js applications. It utilizes the `node:inspector` module to capture CPU profiles and can be seamlessly integrated with CMMV applications to monitor and optimize performance. The module also provides utility methods to manage and persist profiling data.

## Installation

Install the `@cmmv/inspector` package via npm:

```bash
$ pnpm add @cmmv/inspector
```

## Quick Start

Below is a simple example of how to start, stop, and save a profile using the ``Inspector`` class:

```typescript
import { Inspector } from "@cmmv/inspector";

// Start the profiler
await Inspector.start();

// Perform some operations...

// Stop the profiler and save the profile
await Inspector.stop();
await Inspector.saveProfile("/path/to/save/profile");
```

## Process Signals

To ensure the profiler stops gracefully during application shutdown:

```typescript
Inspector.bindKillProcess();
```

## API Reference

``start(): Promise<void>``
Starts the profiler and initializes the session.

``stop(): Promise<void>``
Stops the profiler, captures the CPU profile, and disconnects the session.

``saveProfile(dirName: string, restart: boolean = true): Promise<void>``
Saves the CPU profile to the specified directory. If restart is true, the profiler restarts after saving.

``bindKillProcess(): void``
Binds to process kill signals and ensures the profiler stops gracefully.

## Example Workflow

```typescript
import { Inspector } from "@cmmv/inspector";

async function main() {
    // Start the profiler
    await Inspector.start();

    // Perform operations
    for (let i = 0; i < 1e6; i++) {
        Math.sqrt(i);
    }

    // Stop the profiler and save the profile
    await Inspector.stop();
    await Inspector.saveProfile("./profiles", false);

    console.log("Profile saved!");
}

main();
```