<p align="center">
  <a href="https://cmmv.io/" target="blank"><img src="https://raw.githubusercontent.com/andrehrferreira/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png" width="300" alt="CMMV Logo" /></a>
</p>
<p align="center">Contract-Model-Model-View (CMMV) <br/> Building scalable and modular applications using contracts.</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@cmmv/inspector"><img src="https://img.shields.io/npm/v/@cmmv/inspector.svg" alt="NPM Version" /></a>
    <a href="https://github.com/andrehrferreira/cmmv-inspector/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cmmv/inspector.svg" alt="Package License" /></a>
</p>

<p align="center">
  <a href="https://cmmv.io">Documentation</a> &bull;
  <a href="https://github.com/andrehrferreira/cmmv-inspector/issues">Report Issue</a>
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

The following workflow demonstrates how to use the ``@cmmv/inspector`` module to start profiling, register cleanup tasks using the ``once`` method, perform operations, capture a heap snapshot, and gracefully stop the profiler during process termination. The ``once`` method ensures that custom finalization logic is executed before the system exits, providing a structured way to handle cleanup tasks.

```typescript
import { Inspector } from "@cmmv/inspector";

async function main() {
    // Register a cleanup task
    Inspector.once(async () => {
        console.log("Performing cleanup: Saving heap snapshot...");
        await Inspector.takeHeapSnapshot("./snapshots");
        console.log("Heap snapshot saved!");
    });

    // Bind process kill signals to ensure proper finalization
    Inspector.bindKillProcess();

    // Start the profiler
    await Inspector.start();

    // Perform operations to simulate workload
    for (let i = 0; i < 1e6; i++) {
        Math.sqrt(i); // Example operation
    }

    // Stop the profiler and save the CPU profile
    await Inspector.stop();
    await Inspector.saveProfile("./profiles", false);

    console.log("Profile saved and profiler stopped!");
}

main();
```

## Heap Snapshot 

The ``@cmmv/inspector`` module includes the ``takeHeapSnapshot`` method, which captures a snapshot of the current memory heap. This feature is particularly useful for diagnosing memory leaks, analyzing object allocations, and optimizing memory usage in Node.js applications.

* **Comprehensive Memory Dump:** Captures a full representation of the memory heap, including objects, closures, and references.
* **Integration with Chrome DevTools:** The snapshot can be saved in .heapsnapshot format and analyzed using Chrome DevTools for detailed insights.
* **Process Monitoring:** Ideal for capturing memory state during critical events, such as process termination or unexpected behavior.

### Example 

Below is an example demonstrating how to capture and save a heap snapshot using the ``takeHeapSnapshot`` method:

```typescript
import { Inspector } from "@cmmv/inspector";

async function captureHeap() {
    const snapshotDir = "./heap_snapshots";

    console.log("Taking a heap snapshot...");
    await Inspector.takeHeapSnapshot(snapshotDir);
    console.log(`Heap snapshot saved to ${snapshotDir}`);
}

captureHeap();
```

### Use Case in Cleanup

The ``takeHeapSnapshot`` method is especially powerful when combined with the ``once`` method to capture memory state during process termination:

```typescript
Inspector.once(async () => {
    console.log("Finalizing: Capturing heap snapshot...");
    await Inspector.takeHeapSnapshot("./final_snapshots");
    console.log("Heap snapshot captured during cleanup.");
});
```

### Benefits of Heap Snapshots

1. **Memory Leak Detection:** Identify objects that are not properly garbage collected.
2. **Performance Optimization:** Analyze memory usage patterns and optimize object lifetimes.
3. **Debugging:** Inspect memory states to understand runtime behaviors during errors or unexpected terminations.

By ``leveraging`` the takeHeapSnapshot method, developers can gain deep visibility into application memory, helping to maintain performance and reliability.