import os
import base64
import mimetypes

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code repo
# and add the `decky-loader/plugin/imports` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky
import asyncio

class Plugin:
    # A normal method. It can be called from the TypeScript side using @decky/api.
    async def add(self, left: int, right: int) -> int:
        return left + right

    async def long_running(self):
        await asyncio.sleep(15)
        # Passing through a bunch of random data, just as an example
        await decky.emit("timer_event", "Hello from the backend!", True, 2)

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.loop = asyncio.get_event_loop()
        decky.logger.info("Hello World!")

    # Function called first during the unload process, utilize this to handle your plugin being stopped, but not
    # completely removed
    async def _unload(self):
        decky.logger.info("Goodnight World!")
        pass

    # Function called after `_unload` during uninstall, utilize this to clean up processes and other remnants of your
    # plugin that may remain on the system
    async def _uninstall(self):
        decky.logger.info("Goodbye World!")
        pass

    async def start_timer(self):
        self.loop.create_task(self.long_running())

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky.logger.info("Migrating")
        # Here's a migration example for logs:
        # - `~/.config/decky-template/template.log` will be migrated to `decky.decky_LOG_DIR/template.log`
        decky.migrate_logs(os.path.join(decky.DECKY_USER_HOME,
                                               ".config", "decky-template", "template.log"))
        # Here's a migration example for settings:
        # - `~/homebrew/settings/template.json` is migrated to `decky.decky_SETTINGS_DIR/template.json`
        # - `~/.config/decky-template/` all files and directories under this root are migrated to `decky.decky_SETTINGS_DIR/`
        decky.migrate_settings(
            os.path.join(decky.DECKY_HOME, "settings", "template.json"),
            os.path.join(decky.DECKY_USER_HOME, ".config", "decky-template"))
        # Here's a migration example for runtime data:
        # - `~/homebrew/template/` all files and directories under this root are migrated to `decky.decky_RUNTIME_DIR/`
        # - `~/.local/share/decky-template/` all files and directories under this root are migrated to `decky.decky_RUNTIME_DIR/`
        decky.migrate_runtime(
            os.path.join(decky.DECKY_HOME, "template"),
            os.path.join(decky.DECKY_USER_HOME, ".local", "share", "decky-template"))

    def _guess_mime(self, path: str) -> str:
        mime, _ = mimetypes.guess_type(path)
        return mime or 'image/jpeg'

    async def get_image_as_base64(self, path: str) -> str:
        """Read a local image file and return a data URL base64 string.
        Returns empty string on failure.
        """
        try:
            if not path:
                return ""
            # Normalize file:// URLs to filesystem path
            if path.startswith('file://'):
                path = path.replace('file://', '', 1)
            if not os.path.isfile(path):
                decky.logger.error(f"Not a file: {path}")
                return ""
            with open(path, 'rb') as f:
                data = f.read()
            b64 = base64.b64encode(data).decode('ascii')
            mime = self._guess_mime(path)
            return f"data:{mime};base64,{b64}"
        except Exception as e:
            decky.logger.exception(f"Failed for {path}: {e}")
            return ""

    async def get_images_as_base64(self, paths: list) -> list:
        """Batch version: accepts list of paths, returns list of data URLs (empty string for failures)."""
        results = []
        for p in (paths or []):
            try:
                res = await self.get_image_as_base64(str(p))
            except Exception:
                res = ""
            results.append(res)
        return results

    async def get_sys_vendor(self) -> str:
        """Return DMI system vendor from /sys/class/dmi/id/sys_vendor, or empty string on failure."""
        path = "/sys/class/dmi/id/sys_vendor"
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read().strip()
        except Exception as e:
            try:
                decky.logger.warning(f"get_sys_vendor failed: {e}")
            except Exception:
                pass
            return ""
