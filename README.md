# HSON-WASM

Use [hson](https://crates.io/crates/hson) from javascript.

## Usage

See example.js or example.html for full examples.  
The lib directory contains a ready to use wasm file.  
Run `cargo build --target wasm32-unknown-unknown --release` to rebuild the wasm file, 
copy the new wasm file from 'target/wasm32-unknown-unknown/release/hson_wasm.wasm' to 'lib' folder and rename it to `hson.wasm`.

### Instantiation

```js
const Hson = require('hson-wasm');

await Hson.instantiate();

// Client-side
await Hson.instantiate(path_to_wasm);

const hson = Hson.new();
```

### Parsing
```js
const data = `{
    "div": {
      "attrs": {
        "class": ["active", 123, 0.25864, "test"],
        "onClick": "doSomething"
      },
      "div": {
        "p": {
          "attrs": {
            "id": 12,
            "rate": 0.4321,
            "trusted": true,
            "text": "foo"
          },
          "span": {
            "text": "Hello"
          }
        },
        "p": {
          "span": {
            "text": "World"
          }
        }
      },
      "div": {
        "component": "test",
        "attrs": {},
        "onClick": "componentDoSomething"
      }
    }
  }`;

hson.parse(data);
/* ... */
```

### Stringify
```js
const s = hson.stringify();
console.log(s);
```

### Searching

See https://crates.io/crates/hson#Searching for all options.  
Searching will return an array of nodes identifier (int), see [Querying](#Querying) to get nodes vertexes.  

```js
const search = hson.search("div");
console.log(search); // [ 2, 10, 22 ]

// Search in a specific node
const search = hson.search_in(search[0], "div");
console.log(search); // [ 10, 22 ]
```

### Querying

Work as [Searching](#Searching) but return nodes vertexes instead of identifiers. 

```js
const query = hson.query("div");
console.log(query);

/* Will print:

[   
    { 
      childs: [ 3, 10, 22 ],
      id: 2,
      key: 'div',
      kind: 'Node',
      parent: 1,
      value: '"attrs":{"class":["active",123,0.25864,"test"],"onClick":"doSomething"},"div":{"p":{"attrs":{"id":12,"rate":0.4321,"trusted":true,"text":"foo"},"span":{"text":"Hello"}},"p":{"span":{"text":"World"}}},"div":{"component":"test","attrs":{},"onClick":"componentDoSomething"}' 
    },
    { 
      childs: [ 11, 19 ],
      id: 10,
      key: 'div',
      kind: 'Node',
      parent: 2,
      value: '"p":{"attrs":{"id":12,"rate":0.4321,"trusted":true,"text":"foo"},"span":{"text":"Hello"}},"p":{"span":{"text":"World"}}' 
    },
    { 
      childs: [ 23, 24, 25 ],
      id: 22,
      key: 'div',
      kind: 'Node',
      parent: 2,
      value: '"component":"test","attrs":{},"onClick":"componentDoSomething"' 
    } 
]
*/

// Or query a specific node
const query = hson.query_on(query[0], "div");
console.log(query);
```

### Insert

Insert data in the node at provided position.

```js
const new_data = `{
    "ul": {
      "li": {
        "text": "World"
      }
    }
  }`;

// node_id, position, data
hson.insert(search[0], 0, new_data);
  /* ... */
```

### Remove

```js
hson.remove(search[2]);
  /* ... */
```

### Replace 

```js
hson.replace(search[1], new_data);
  /* ... */
```

### Utils

#### Is_child

```js
console.log(hson.is_child(search[0], search[1]));
```

#### Cast

```js
const query = hson.query("id");
console.log(query[0].cast());
```