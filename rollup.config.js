import deckyPlugin from "@decky/rollup";
import pkg from "./package.json" assert {type: "json"};
import replace from '@rollup/plugin-replace';

export default deckyPlugin({
    plugins: [
        replace({
            preventAssignment: true,
            __PLUGIN_NAME__: JSON.stringify(pkg.name),
            __PLUGIN_VERSION__: JSON.stringify(pkg.version)
        })
    ]
});
