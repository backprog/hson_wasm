
const TextDecoder = is_node() ? require('util').TextDecoder : window.TextDecoder;
const TextEncoder = is_node() ? require('util').TextEncoder : window.TextEncoder;

function is_node () {
  const fs = require('fs');
  return (typeof fs !== 'undefined' && typeof fs.readFileSync !== 'undefined');
}


class HsonWasm {
  constructor (instance) {
    this.instance = instance;
    this.instance.debug();
  }

  parse (data_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.parse(this.newString(data_str))));
      if (result.status === 'ERR') throw new Error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  stringify () {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.stringify()));
      if (result.status === 'ERR') throw new Error(result.reason);
      return (result.status === 'OK') ? result.data : null;
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  search (search_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.search(this.newString(search_str))));
      if (result.status === 'OK') {
        const data = JSON.parse(result.data);
        return data.map((item) => item.id);
      } else {
        throw new Error(result.reason);
      }
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  search_in (node_id, search_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.search_in(node_id, this.newString(search_str))));
      if (result.status === 'OK') {
        const data = JSON.parse(result.data);
        return data.map((item) => item.id);
      } else {
        throw new Error(result.reason);
      }
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  query (query_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.query(this.newString(query_str))));
      if (result.status === 'OK') {
        let l = result.data.length;

        while (l--)
          result.data[l].cast = this.cast.bind(result.data[l]);

        return result.data;
      } else {
        throw new Error(result.reason);
      }
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  query_on (node_id, query_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.query_on(node_id, this.newString(query_str))));
      if (result.status === 'OK') {
        let l = result.data.length;

        while (l--)
          result.data[l].cast = this.cast.bind(result.data[l]);

        return result.data;
      } else {
        throw new Error(result.reason);
      }
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  insert (node_id, position, data_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.insert(node_id, position, this.newString(data_str))));
      if (result.status === 'ERR') throw new Error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  remove (node_id) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.remove(node_id)));
      if (result.status === 'ERR') throw new Error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  replace (node_id, data_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.replace(node_id, this.newString(data_str))));
      if (result.status === 'ERR') throw new Error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  is_child (parent_id, child_id) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.is_child(parent_id, child_id)));
      if (result.status === 'ERR') throw new Error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }

  print () {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.get_formatted_data()));
      if (result.status === 'OK') console.log(result.data);
      else throw new Error(result.reason);
    } catch (e) {
      if (e instanceof Error) throw e;
      else throw new Error(e);
    }
  }


  cast () {
    switch (this.kind) {
      case 'Node': return JSON.parse(`{${this.value}}`);
      case 'Array': return JSON.parse(`[${this.value}]`);
      case 'Integer': return parseInt(this.value);
      case 'Float': return parseFloat(this.value);
      case 'String': return this.value;
      case 'Bool': return (this.value === 'true');
      case 'Undefined': return null;
      default: return this.value;
    }
  }

  copyCStr (ptr) {
    let orig_ptr = ptr;
    const self = this;

    const collectCString = function* () {
      let memory = new Uint8Array(self.instance.memory.buffer);
      while (memory[ptr] !== 0) {
        if (memory[ptr] === undefined) { throw new Error("Tried to read undef mem"); }
        yield memory[ptr];
        ptr += 1;
      }
    }

    const buffer_as_u8 = new Uint8Array(collectCString());
    const utf8Decoder = new TextDecoder("UTF-8");
    const buffer_as_utf8 = utf8Decoder.decode(buffer_as_u8);
    self.instance.dealloc_str(orig_ptr);
    return buffer_as_utf8;
  }

  getStr (ptr, len) {
    const getData = function* (ptr, len) {
      let memory = new Uint8Array(self.instance.memory.buffer);
      for (let index = 0; index < len; index++) {
        if (memory[ptr] === undefined) { throw new Error(`Tried to read undef mem at ${ptr}`); }
        yield memory[ptr + index];
      }
    }

    const buffer_as_u8 = new Uint8Array(getData(ptr/8, len/8));
    const utf8Decoder = new TextDecoder("UTF-8");
    const buffer_as_utf8 = utf8Decoder.decode(buffer_as_u8);
    return buffer_as_utf8;
  }

  newString (str) {
    const utf8Encoder = new TextEncoder("UTF-8");
    let string_buffer = utf8Encoder.encode(str);
    let len = string_buffer.length;
    let ptr = this.instance.alloc(len+1);

    let memory = new Uint8Array(this.instance.memory.buffer);
    for (let i = 0; i < len; i++) {
      memory[ptr+i] = string_buffer[i];
    }

    memory[ptr+len] = 0;

    return ptr;
  }
}

class HsonWasmFactory {
  constructor () {
    this.is_node = is_node();
    this.module = null;
    this.env = {
      memoryBase: 0,
      tableBase: 0,
      memory: new WebAssembly.Memory({
        initial: 256
      }),
      table: new WebAssembly.Table({
        initial: 0,
        element: 'anyfunc'
      }),
      console: (ptr) => {
        let str = this.copyCStr(ptr);
        console.log(str);
      }
    };
  }

  instantiate (path_to_wasm = null) {
    return new Promise((resolve, reject) => {
      if (this.is_node) {
        const fs = require('fs');
        const path = require('path');

        try {
          const src_path = path.resolve(__dirname, 'lib', 'hson.wasm');
          const source = fs.readFileSync(src_path);
          this.module = new Uint8Array(source);
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        WebAssembly.instantiateStreaming(fetch(path_to_wasm), { env: this.env }).then(result => {
          this.module = result.module;
          resolve();
        }).catch(reject);
      }
    });
  }

  new () {
    return new Promise((resolve, reject) => {
      WebAssembly.instantiate(this.module, { env: this.env }).then(result => {
        const instance = (result.exports) ? result.exports : result.instance.exports;
        const hson = new HsonWasm(instance);
        resolve(hson);
      }).catch(reject);
    });
  }
}


const Hson = new HsonWasmFactory();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Hson;
}