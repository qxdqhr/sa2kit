# MMD Module Memory Leak Fix

This document outlines a critical memory leak found in the `mmd` module and the steps taken to resolve it.

## Problem Analysis

The `mmd` module, specifically the `MMDPlayerBase` component, was experiencing severe memory leaks, leading to out-of-memory errors and browser crashes. This issue was most noticeable when the component was repeatedly mounted and unmounted, such as in a playlist or when navigating between pages.

The root cause was identified in the `useEffect` hook within `src/mmd/components/MMDPlayerBase.tsx`. The cleanup function (the return value of `useEffect`) was incomplete.

### Key Issues:

1.  **Incomplete `three.js` Cleanup**: The component disposed of the `WebGLRenderer` but failed to release other high-memory `three.js` objects. Geometries (`.geometry`), materials (`.material`), and textures (`.material.map`) were left in memory after the component unmounted.
2.  **`MMDAnimationHelper` Not Disposed**: The `MMDAnimationHelper` instance, which manages animations and the physics simulation, was never disposed of. This was a major source of the leak, as it held references to the entire model, animations, and the Ammo.js physics world.
3.  **Leaked Audio Resources**: `Audio` and `AudioListener` objects were not being cleaned up.

Each time the component re-rendered with new props, a new set of these resources was created, but the old ones were never garbage-collected, causing a rapid increase in memory consumption.

## Solution Implemented

To fix the memory leak, the `useEffect` hook in `MMDPlayerBase.tsx` was refactored to implement a comprehensive cleanup routine.

### Main Changes:

1.  **Created a `cleanup` Function**: A dedicated `cleanup` function was created inside the `useEffect` hook. This function is responsible for meticulously disposing of all allocated resources.
2.  **Full Resource Disposal**: The `cleanup` function now correctly:
    *   Cancels the `requestAnimationFrame` loop.
    *   Removes the window `resize` event listener.
    *   Calls `helper.dispose()` to clean up the `MMDAnimationHelper`, which in turn releases the physics world.
    *   Traverses the `three.js` scene (`scene.traverse`) to find and dispose of all geometries, materials, and associated textures for every mesh in the scene.
    *   Disposes of the `WebGLRenderer` and removes its canvas element from the DOM.
3.  **Robust `useEffect` Lifecycle**: The `init` function is now an `async` function that, upon successful initialization, defines and returns the `cleanup` function. The `useEffect` hook's return statement is now simply a call to this `cleanup` function, ensuring it is reliably executed on unmount or re-render.
4.  **Async/Await and Error Handling**: The initialization logic was updated to use `async/await` with `loader.loadAsync` for a cleaner, more readable asynchronous flow and improved error handling.

These changes ensure that all resources are properly released when the `MMDPlayerBase` component is no longer in use, completely resolving the memory leak.

## Additional Fix for TypeError: Cannot read properties of null (reading 'bones')

During the testing of the memory leak fix, a `TypeError` was observed: `Cannot read properties of null (reading 'bones')`. This error occurred within `MMDLoader.js` when attempting to build skeletal animations, specifically when `mesh.skeleton` was `null` or `undefined`.

### Problem Analysis (TypeError)

The `MMDAnimationHelper` and its underlying `AnimationBuilder`, `CCDIKSolver`, and `GrantSolver` components expect the loaded `THREE.SkinnedMesh` to always have a valid `skeleton` property containing `bones`. While `MMDLoader`'s `MeshBuilder` is designed to create a `SkinnedMesh` and bind a `Skeleton` to it, certain conditions can lead to this `TypeError`:

1.  **Non-Skeletal Models**: If `modelUrl` points to an MMD model that, for some reason, does not contain skeletal animation data, or is malformed, the `MMDLoader` might produce a `THREE.Mesh` or `THREE.SkinnedMesh` without a properly initialized `skeleton` property.
2.  **Corrupted or Invalid MMD Files**: Malformed `.pmx` or `.pmd` files could lead to `mesh.skeleton` being `null` or incomplete after `MMDLoader` processes them, even if the `mesh` itself is a `SkinnedMesh`.

The `TypeError` would cause the application to crash immediately upon attempting to load animations or physics for such a mesh.

### Solution Implemented (TypeError)

To address the `TypeError`, a runtime check was introduced in `src/mmd/components/MMDPlayerBase.tsx` before attempting to apply animations or physics to the loaded mesh.

A utility function `isSkinnedMeshWithSkeleton` was added to verify if the loaded `mesh` is:
1.  An instance of `THREE.SkinnedMesh`.
2.  Has a defined and non-null `skeleton` property.

If these conditions are not met, a warning is logged to the console, and the animation and physics application steps for that specific mesh are gracefully skipped. The component can now load MMD models that may lack skeletal data without crashing, allowing for more robust handling of various MMD file types. This ensures that the application remains stable even when encountering models that do not conform to the expected skeletal structure.

## Fixing the MMDPlaylist Memory Issue

Even after fixing the memory leak in `MMDPlayerBase` and the `TypeError`, the `MMDPlaylist` component still caused out-of-memory errors. The root cause was the playlist's rendering strategy.

### Problem Analysis (MMDPlaylist)

The `MMDPlaylist` component was designed to render all `MMDPlayerEnhanced` instances at once, using CSS (`visibility: hidden`) to hide the inactive players. This approach is highly problematic for memory-intensive components like a WebGL player:

1.  **Massive Resource Consumption**: Every single player component in the playlist was mounted in the DOM, holding onto its own set of high-memory resources (3D models, textures, animations, WebGL contexts, and physics simulations). This caused the browser's memory and GPU limits to be exhausted very quickly, especially with longer playlists.
2.  **Ineffective Cleanup**: The component attempted to manage memory manually with `clearNodeResources` and `emergencyMemoryCleanup` functions. However, these were fighting against React's lifecycle. Since the components were never unmounted, their resources were not being garbage-collected reliably, leading to the memory warnings and crashes.

The problem was not a "leak" in the traditional sense, but a fundamental design flaw of keeping too many heavy components alive simultaneously.

### Solution Implemented (MMDPlaylist)

The `MMDPlaylist` component was refactored to adopt a much more efficient and standard React-based approach:

1.  **Render Only the Active Player**: The rendering logic was changed to only mount the *single, currently active* `MMDPlayerEnhanced` component. All other player instances are not rendered at all.
2.  **Leveraging Component Lifecycle for Cleanup**: When the `currentNodeIndex` changes, React's reconciliation process handles the cleanup automatically:
    *   The `key` prop of the `MMDPlayerEnhanced` component is now tied to the `currentNode.id`.
    *   When the `key` changes, React unmounts the old component instance.
    *   This unmounting triggers the `useEffect` cleanup function within `MMDPlayerBase`, which now reliably and completely disposes of all resources associated with the old player.
    *   A new instance of `MMDPlayerEnhanced` is mounted for the new node, loading its resources from scratch.
3.  **Simplification**: This change completely removes the need for the complex, error-prone manual memory management (`clearNodeResources`, `emergencyMemoryCleanup`, memory monitoring), significantly simplifying the `MMDPlaylist` component and making it more robust and predictable.

This new architecture ensures that only one player's resources are in memory at any given time, completely resolving the out-of-memory crashes and making the playlist scalable to any number of nodes.

Finally, the UI for managing the playlist, including controls for "Next," "Previous," "Jump To," and a settings panel for node management, was restored. This UI was adapted to work seamlessly with the new single-player rendering model, providing full playlist functionality without sacrificing memory efficiency.
