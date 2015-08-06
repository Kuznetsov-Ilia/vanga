var
spawn = require('child_process').spawn,
path = require("path"),
fs = require('fs'),
domain = require('domain'),
events = require('events'),

tmp = require('tmp'),
_queue = require('async-queue-stream'),
gutil = require('gulp-util');

function gulp_spawn_shim(_opts, cb) {
    'use strict';

    if (typeof _opts === 'function') {
        cb = _opts;
        _opts = {};
    } else {
        if(!_opts.cmd)
            throw new Error('Command for child_process.spawn is required');

        if(typeof _opts.cmd !== 'string')
            throw new Error('Command for child_process.spawn must be a string');
    }

    var opts = _opts || {};

    // Spawn args as defined in http://nodejs.org/api/child_process.html
    opts.cmd = _opts.cmd;
    opts.args = _opts.args || [];
    opts.options = _opts.options || void 0;

    // micro-template args
    var config_args = function(opts, file) {

        // template the args
        var exp = {};
        exp.basename = path.basename(file.path);
        exp.extname = path.extname(exp.basename);
        exp.filename = path.basename(exp.basename, exp.extname);
        exp.file = file;

        opts.args = (opts.args).map(function(elem){
            return gutil.template(elem, exp);
        });

    };

    /**
     * Custom events for stream:
     * - stderr
     * - exit (exit code)
     *
     * TODO: merge them?
     */
    var super_bus = new events.EventEmitter();

    // cb.call(null, file, opts, callback);

    var _write = function(opts, file, cb) {

        // pass along
        if (file.isNull()) return cb(null, file);

        var err_catcher = domain.create();

        /**
         * Available events:
         * publish
         */
        var
        bus = new events.EventEmitter(),
        fatal_error = false;

        // properly invoke callback once
        bus.once('publish', function(err, _file) {

            if(err) {
                bus.removeAllListeners();
                return cb(err);
            }

            if(fatal_error === true)
                return cb();

            return cb(err, _file);
        });


        // handle stream error appropriately
        err_catcher.once('error', function(err) {

            if(err)
                fatal_error = true;

            // Broken pipe
            if (err.code == "EPIPE" || err.code == "ENOENT") {
                return bus.emit('publish');
            }

            bus.emit('publish', err);
        });

        // micro-template args
        config_args(opts, file);

        var child = spawn(opts.cmd, opts.args, opts.options);

        // attach streams to handle errors
        err_catcher.add(child);
        err_catcher.add(child.stdin);
        err_catcher.add(child.stdout);
        err_catcher.add(child.stderr);
        err_catcher.add(file.contents);

        child
            .once('error', function(err) {
                return bus.emit('publish', err);
            });

        child.stdin
            .once('error', function(err) {
                return bus.emit('publish', err);
            });

        // capture spawn.stderr
        var _stderr = '';

        child.stderr.on('data', function (data) {
            _stderr += data;
        }).on('end', function() {
            if(_stderr.length > 0)
                return super_bus.emit('stderr', _stderr);
        });

        // capture spawn exit code
        child.on('close', function(num) {
            return super_bus.emit('exit', num);
        });


        if (file.isStream()) {

            tmp.setGracefulCleanup();

            // 1. Create tmp file
            tmp.file(function _tempFileCreated(err, tmp_path, fd) {
                if (err) return bus.emit('publish', err);

                // Attempt to write to stdin

                file.contents
                    .pipe(child.stdin)
                    .once('error', function(err) {
                        return bus.emit('publish', err);
                    });

                var tmp_file = fs.createWriteStream(tmp_path);


                var written_tmp = false;
                child.stdout
                    // 2. Attempt to write to tmp file
                    .on('data', function(data) {
                        tmp_file.write(data);
                        written_tmp = true;
                    })
                    // 3. Publish file when tmp file was written or not
                    .once('end', function() {
                        tmp_file.end();

                        if(written_tmp === false) {
                            return bus.emit('publish');
                        }

                        file.contents = fs.createReadStream(tmp_path);

                        return bus.emit('publish', void 0, file);
                    });
            });

            return;

        } else if (file.isBuffer()) {

            var
            output = new Buffer(0),
            rec_data = false;

            child.stdout.on("data", function (chunk) {
                rec_data = true;
                output = Buffer.concat([output, chunk]);
            });

            child.stdout.once("end", function () {

                if(rec_data === false)
                    return bus.emit('publish', new Error("Received no output from stdout."));

                file.contents = output;
                return bus.emit('publish', void 0, file);
            });

            child.stdin.write(file.contents);

            child.stdin.end();
            return;
        }

    };

    // TODO: clean up
    var user_cb_wrapper = function(through_cb, file, opts) {

        if(!opts.cmd)
            return through_cb(new Error('Command for child_process.spawn is required'));

        if(typeof opts.cmd !== 'string')
            return through_cb(new Error('Command for child_process.spawn must be a string'));

        return _write(opts, file, through_cb);
    }

    var _write_wrapper = function(file, through_cb) {
        if(typeof cb === 'function') {

            var binded_cb = user_cb_wrapper.bind(this, through_cb);

            var new_opts = JSON.parse(JSON.stringify(opts));

            return cb.call(null, file, new_opts, binded_cb);
        }

        return _write(opts, file, through_cb);
    };

    // var stream = _queue(_write);
    var stream = _queue(_write_wrapper);

    super_bus.on('stderr', function(stderr) {
        stream.emit('stderr', stderr);
    });

    super_bus.on('exit', function(exit) {
        stream.emit('exit', exit);
    });

    return stream;
}

module.exports = gulp_spawn_shim.bind({});
