const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const rimraf = require('rimraf');


class Builder {
  constructor () {
    this.output_dir = 'build';
    this.output_lib_dir = 'lib';
    this.output_path = path.resolve(this.output_dir, this.output_lib_dir);
  }

  async build () {
    try {
      await this.createBuildDir();
      await this.createPackage();
      await this.copyPackageFiles();
      await this.copyIndexFile();

      process.stdout.write('Build done.\n');
      process.exit(0);
    } catch (e) {
      process.stderr.write(e.toString() + '\n');
      process.exit(1);
    }
  }

  async createBuildDir () {
    try {
      await promisify(fs.stat)(this.output_path);
      await promisify(rimraf)(this.output_path);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    await promisify(fs.mkdir)(this.output_path);
  }

  async createPackage () {
    return new Promise((resolve, reject) => {
      const pack = spawn('wasm-pack', ['build']);

      pack.on('exit', (code) => {
        return (code > 0) ? reject(new Error('wasm-pack build error')) : resolve(true);
      });
    });
  }

  async copyPackageFiles () {
    const packageJson = require(path.resolve('pkg', 'package.json'));
    const files = packageJson.files;

    for (const file of files) {
      const src = path.resolve('pkg', file);
      const target = path.resolve(this.output_path, file);
      await promisify(fs.copyFile)(src, target);
    }

    await promisify(fs.copyFile)(path.resolve('pkg', 'package.json'), path.resolve(this.output_dir, 'package.json'));
    await promisify(fs.copyFile)(path.resolve('pkg', 'README.md'), path.resolve(this.output_dir, 'README.md'));
  }

  async copyIndexFile () {
    const target = path.resolve(this.output_dir, 'index.js');
    await promisify(fs.copyFile)('index.js', target);
  }
}

const builder = new Builder();
builder.build().then();
