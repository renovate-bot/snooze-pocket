const browserify = require('browserify');
const {dest, parallel, series, src, task, watch} = require('gulp');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const tsify = require('tsify');

const ENTRY_FILES = ['src/popup/popup.ts'];

let _debug = false;

task('build:static', done => {
  src(['src/**/*', '!src/**/*.ts'])
    .pipe(dest(() => 'dist'))
    .on('end', done);
});

task('build:thirdparty [photon-icons]', done => {
  src(['node_modules/photon-icons/icons/desktop/history-16.svg'], {
    base: 'node_modules/photon-icons/icons/desktop',
  })
    .pipe(dest(() => 'dist/third_party/photon-icons'))
    .on('end', done);
});

task('build:thirdparty', series('build:thirdparty [photon-icons]'));

/**
 * Generates a tsify subtask.
 * @param entryFile to generate a tsify task for.
 * @returns a gulp subtask.
 */
function _tsifySubTaskGenerator(entryFile) {
  const subTask = cb => {
    browserify({debug: _debug})
      .add(entryFile)
      .plugin(tsify)
      .bundle()
      .on('error', cb)
      .pipe(source(entryFile))
      .pipe(
        rename(path => {
          if (path.dirname === 'src') {
            path.dirname = '.';
          } else if (path.dirname.startsWith('src/')) {
            path.dirname = `./${path.dirname.slice(4)}`;
          } else {
            throw new Error(`Unexpected path object: ${path}`);
          }
          path.extname = '.js';
        }),
      )
      .pipe(dest('dist'))
      .on('end', cb);
  };
  subTask.displayName = `build:tsify [${entryFile}]`;
  return subTask;
}

_tsify = task('build:tsify', done => {
  parallel(...ENTRY_FILES.map(entryFile => _tsifySubTaskGenerator(entryFile)))(
    done,
  );
});

exports.build = parallel('build:static', 'build:thirdparty', 'build:tsify');

task('watch:static', () => {
  return watch(
    ['src/**/*', '!src/**/*.ts'],
    {ignoreInitial: false},
    series('build:static'),
  );
});

task('watch:thirdparty', () => {
  return watch(
    ['node_modules/photon-icons/**/*'],
    {ignoreInitial: false},
    series('build:thirdparty'),
  );
});

task('watch:tsify', () => {
  _debug = true;
  return watch(
    ['src/**/*.ts', 'tsconfig.json'],
    {ignoreInitial: false},
    series('build:tsify'),
  );
});

exports.watch = parallel('watch:static', 'watch:thirdparty', 'watch:tsify');
