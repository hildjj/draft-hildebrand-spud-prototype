module.exports = function(grunt) {
  // Load Grunt tasks declared in the package.json file
  require('jit-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    express: {
      all: {
        options: {
          port: 9000,
          hostname: "localhost",
          bases: ['output'],
          livereload: true,
          open: 'http://localhost:<%= express.all.options.port%>/draft-hildebrand-spud-prototype.html'
        }
      }
    },
    watch: {
      kramdown: {
        files: ['draft-hildebrand-spud-prototype.md'],
        tasks: ['kramdown_rfc2629'],
        options: {
          livereload: true
        }
      },
      pdu: {
        files: ['spud.pdu'],
        tasks: ['pdu2html'],
        options: {
          livereload: true
        }
      },
      states: {
        files: ['states.dot'],
        tasks: ['states'],
        options: {
          livereload: true
        }
      }
    },
    kramdown_rfc2629: {
      all: {
        src: ['draft-hildebrand-spud-prototype.md']
      }
    },
    shell: {
      pdu2html: {
        command: 'cp styles.css output; ../pdu2html/pdu2html spud.pdu > output/spud.html'
      },
      states: {
        command: 'dot states.dot -Tpng -o output/states.png'
      },
      release: {
        command: './release.sh'
      }
    },
  });

  grunt.registerTask('default', ['kramdown_rfc2629']);
  grunt.registerTask('all', ['kramdown_rfc2629', 'pdu2html', 'states']);
  grunt.registerTask('server', ['kramdown_rfc2629', 'express', 'watch'])
  grunt.registerTask('pdu2html', ['shell:pdu2html'])
  grunt.registerTask('states', ['shell:states'])
  grunt.registerTask('release', ['shell:release'])
};
