# Building AI Prompt Generator from Source

This document provides instructions on how to build installable binaries and packages for the AI Prompt Generator application from its source code using Electron Builder.

## Prerequisites

*   You have successfully completed the **Installation (For Development)** steps outlined in the main [README.md](README.md) file (cloned the repo, navigated to the directory, installed dependencies with `npm install`).
*   **Node.js 20 and npm:** Required for running build scripts and managing dependencies.
*   **Git:** Required for cloning the repository.
*   **Platform-Specific Tools:** Building for certain targets might require additional tools installed on your system (see Platform-Specific Notes below).

## Build Commands

Electron Builder is configured via the `build` section in `package.json`. The following npm scripts streamline the build process:

**1. Clean Build and Package (Recommended):**

This command sequence ensures you are building the latest code and then packages it for your current OS (and potentially others based on configuration).

```bash
# Builds the Vue/Electron code and packages the application
npm run build:dist
```
*(`build:dist` is defined in `package.json` as `npm run build && npm run dist`)*

**2. Build Code Only:**

This compiles the TypeScript/Vue code into JavaScript suitable for Electron.

```bash
npm run build
```
*(`build` is defined in `package.json` as `vue-tsc --noEmit -p tsconfig.app.json && vite build`)*

**3. Package Only (Assumes Code is Already Built):**

This command uses Electron Builder to package the already-built code found in the `dist` folders.

```bash
npm run dist
```
*(`dist` is defined in `package.json` as `electron-builder`)*

## Building for Specific Platforms

If you only want to build for a specific target operating system, you can add flags to the `dist` command (or run `electron-builder` directly with flags). Make sure you have run `npm run build` at least once beforehand.

1.  **Build for Windows (.exe installer, .zip):**
    *(Usually needs to be run on a Windows machine)*
    ```bash
    # Using npm script:
    npm run dist -- --win

    # Or using npx directly:
    # npx electron-builder --win
    ```

2.  **Build for macOS (.dmg, .zip):**
    *(MUST be run on a macOS machine)*
    ```bash
    # Using npm script:
    npm run dist -- --mac

    # Or using npx directly:
    # npx electron-builder --mac
    ```

3.  **Build for Linux (.AppImage, .deb, .rpm, .zip):**
    *(Can usually be run on Linux or macOS. May require specific libraries)*
    ```bash
    # Using npm script:
    npm run dist -- --linux

    # Or using npx directly:
    # npx electron-builder --linux
    ```

*(Note: The `--` after `npm run dist` is necessary to pass the platform flags (`--win`, `--mac`, `--linux`) correctly through npm to the underlying `electron-builder` command.)*

## Output Location

The generated application installers and packages will be placed in the `release/<version>` directory within your project folder (e.g., `release/0.0.0`). The exact structure depends on the target platforms built.

## Platform-Specific Notes

*   **macOS:** Building `.dmg` files and especially signing the application for distribution *requires* you to run the build process on a macOS machine with Xcode and appropriate certificates installed.
*   **Windows:** Building `.exe` installers using NSIS generally works best when run on a Windows machine. Code signing requires a Windows environment and a valid certificate.
*   **Linux:**
    *   Building `.deb` packages might require `fakeroot` and `dpkg` to be installed.
    *   Building `.rpm` packages might require `rpmbuild`. 
        ```bash
        sudo apt-get install rpm
        ```
    *   AppImages are generally the most cross-compatible target to build on various Linux distributions or even macOS.