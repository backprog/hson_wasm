const { TextDecoder, TextEncoder } = require('util');

class Hson {
  constructor () {
    this.is_node = (typeof module !== 'undefined' && module.exports);
    this.instance = null;
    this.memory = null;
  }

  instantiate () {
    return new Promise((resolve, reject) => {
      if (this.is_node) {
        const fs = require('fs');
        const path = require('path');

        const src_path = path.resolve(__dirname, 'lib', 'hson.wasm');
        const source = fs.readFileSync(src_path);
        const typedArray = new Uint8Array(source);
        const env = {
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

        WebAssembly.instantiate(typedArray, {
          env: env
        }).then(result => {
          this.instance = result.instance.exports;
          this.instance.debug();
          resolve();
        }).catch(reject);
      } else {

      }
    });
  }

  parse (data_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.parse(this.newString(data_str))));
      if (result.status === 'ERR') console.error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  stringify () {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.stringify()));
      if (result.status === 'ERR') console.error(result.reason);
      return (result.status === 'OK') ? result.data : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  search (search_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.search(this.newString(search_str))));
      if (result.status === 'OK') {
        const data = JSON.parse(result.data);
        return data.map((item) => item.id);
      } else {
        console.error(result.reason);
        return null;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  search_in (node_id, search_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.search_in(node_id, this.newString(search_str))));
      if (result.status === 'OK') {
        const data = JSON.parse(result.data);
        return data.map((item) => item.id);
      } else {
        console.error(result.reason);
        return null;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  query (query_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.query(this.newString(query_str))));
      if (result.status === 'ERR') console.error(result.reason);
      return (result.status === 'OK') ? result.data : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  query_on (node_id, query_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.query_on(node_id, this.newString(query_str))));
      if (result.status === 'ERR') console.error(result.reason);
      return (result.status === 'OK') ? result.data : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  insert (node_id, position, data_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.insert(node_id, position, this.newString(data_str))));
      if (result.status === 'ERR') console.error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  remove (node_id) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.remove(node_id)));
      if (result.status === 'ERR') console.error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  replace (node_id, data_str) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.replace(node_id, this.newString(data_str))));
      if (result.status === 'ERR') console.error(result.reason);
      return (result.status === 'OK' && result.data);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  is_child (parent_id, child_id) {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.is_child(parent_id, child_id)));
      if (result.status === 'ERR') {
        console.error(result.reason);
        return null;
      }

      return (result.status === 'OK' && result.data);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  print () {
    try {
      const result = JSON.parse(this.copyCStr(this.instance.get_formatted_data()));
      if (result.status === 'OK') console.log(result.data);
      else console.error(result.reason);
    } catch (e) {
      console.error(e);
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

module.exports = Hson;
