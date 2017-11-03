import path from "path";
import gutil from "gulp-util";
import { rollup } from "rollup";
import gulp from "gulp";
import rollupBabelrc from "babelrc-rollup";
import rollupReplace from "rollup-plugin-replace";
import rollupBabel from "rollup-plugin-babel";
import rollupProgress from "rollup-plugin-progress";
import rollupResolve from "rollup-plugin-node-resolve";
import rollupJson from "rollup-plugin-json";
import rollupCommonjs from "rollup-plugin-commonjs";
import rollupUglify from "rollup-plugin-uglify";
import rollupGlobals from "rollup-plugin-node-globals";
import rollupBuiltins from "rollup-plugin-node-builtins";

gulp.task("dist", () => {
    return buildUmd(true);
});

function log(msg, color = "green") {
    if (!msg) {
        // eslint-disable-next-line no-console
        console.log(); // Blank line

        return;
    }

    gutil.log(gutil.colors[color](msg));
}

async function buildUmd(minify = false) {
    const rbc = rollupBabelrc();
    rbc.runtimeHelpers = true;
    rbc.exclude = "node_modules/**";

    try {
        log(`Compiling (minified: ${minify})...`);

        const bundle = await rollup({
            input: "src/ActiveApi.js",
            external: ["lodash", "moment"],
            plugins: [
                rollupProgress(),
                rollupBabel(rbc),
                rollupResolve({
                    preferBuiltins: false,
                    browser: true
                }),
                rollupJson(),
                rollupCommonjs(),
                rollupGlobals(),
                rollupBuiltins(),
                rollupReplace({
                    exclude: `./node_modules/**`,
                    ENV: JSON.stringify(process.env.NODE_ENV || "production")
                }),
                minify ? rollupUglify() : {}
            ],
            onwarn
        });

        const baseFilename = `ActiveApi${minify ? ".min" : ""}.js`;
        const file = path.resolve("./dist", baseFilename);
        log();
        log(`Saving compiled module to ${baseFilename}...`);

        await bundle.write({
            file,
            name: "ActiveApi",
            format: "umd",
            globals: {
                lodash: "_",
                moment: "moment"
            },
            sourcemap: minify
        });

        log("Done.");
    } catch (err) {
        log();
        log(err, "red");
    }
}

function onwarn(warning) {
    switch (warning.code) {
        case "THIS_IS_UNDEFINED":
            return;

        case "NON_EXISTENT_EXPORT":
            throw new Error(warning.message);

        default:
            console.log("WARNING", warning);
    }
}
