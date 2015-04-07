/**
 * Created by urahara on 02.04.15.
 */

var through   = require('through2');
var optimizer = require('optimizer');
var fs        = require('fs');

var CONFIG = {
    destination: 'build',
    outputDir:'sources',
    fileNamePrefix:'source',
    fingerprintsEnabled:false,
    minify:true
};

module.exports = function(options) {

    CONFIG.destination         = options.destination         || 'build';
    CONFIG.outputDir           = options.outputDir           || 'sources';
    CONFIG.fileNamePrefix      = options.prefix              || 'src';
    CONFIG.fingerprintsEnabled = options.fingerprintsEnabled || false;
    CONFIG.minify              = options.minify              || true;

    var cleanFile = '';
    var scripts   = [];
    var styles    = [];
    var dependencies = [];
    var precompileMarko = function (file, enc, cb) {

        if (file.isNull()) {
            return cb(null, file);
        }

        function precomplieMarko() {
            var singleLine = String(file.contents).replace(/^\s+|\s+$|\s+(?=\s)|\r|\f|\n|\t|(?=\W)\s(?=\W)/g, "");

            if (file.isStream()) {
                return cb(null, file);
            }
            if (file.isBuffer()) {

                scripts = singleLine.match(/<script\b[^>]*(><\/script>|\/>)/gm);

                if(scripts) {
                    scripts = scripts.map(function (s) {
                        return s.match(/(?=(src='|src=")).*(?=('|"))/)[0].replace(/^src=("|')/, "");
                    });
                }

                styles = singleLine.match(/<link\b[^>]*(><\/link>|\/>|>)/gm);

                if(styles) {
                    styles = styles.map(function (s) {
                        return s.match(/(?=(href='|href=")).*(?=('|"))/)[0].replace(/^href=("|')/, "");
                    });
                }

                if(scripts || styles){
                    scripts.concat(styles).map(function(d){
                        if(d) dependencies.push(d);
                    });
                }

                cleanFile = String(file.contents)
                    .replace(/<link.*rel=('|")stylesheet('|").*(>|\/>)(\r|\n)/gm,"")
                    .replace(/<script.*src=('|").*('|").*(>.*<\/script>|\/>)(\r|\n)/gm,"");


                optimizer.configure({
                    "outputDir": options.destination +'/'+CONFIG.outputDir,
                    "minify": CONFIG.minify,
                    "urlPrefix": './src/'
                });
                optimizer.optimizePage({
                        name: CONFIG.fileNamePrefix,
                        "fingerprintsEnabled": CONFIG.fingerprintsEnabled,
                        dependencies: dependencies
                    },function(err, optimizedPage){
                    if (err) {
                        throw err;
                    }

                    if(optimizedPage.getHeadHtml()){
                        cleanFile = cleanFile.replace(/<\/head>/m,optimizedPage.getHeadHtml()+'\n</head>')
                    };

                    if(optimizedPage.getBodyHtml()){
                        cleanFile = cleanFile.replace(/<\/body>/m,optimizedPage.getBodyHtml()+'\n</body>')
                    };
                    console.log(cleanFile);
                    file.contents = new Buffer(cleanFile);
                    fs.writeFileSync('./'+options.destination+'/'+file.relative, file.contents);
                    return cb(null, file);
                });
            }
        };
        precomplieMarko();
    };
    return through.obj(precompileMarko);
};

