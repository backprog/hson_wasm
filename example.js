const Hson = require('hson-wasm');

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

const new_data = `{
    "ul": {
      "li": {
        "text": "World"
      }
    }
  }`;

const hson = new Hson();

hson.instantiate().then(() => {
  if (hson.parse(data)) {
    hson.print();
    console.log(hson.stringify());

    let search = hson.search("div");
    console.log(search);

    console.log(hson.is_child(search[0], search[1]));

    console.log(hson.search_in(search[0], "div"));

    console.log(hson.query("div"));

    console.log(hson.query_on(search[0], "div"));

    const q = hson.query("id");
    console.log(q);
    console.log(q[0].cast());

    if (hson.insert(search[0], 0, new_data)) {
      hson.print();

      if (hson.remove(search[2])) {
        hson.print();

        if (hson.replace(search[1], new_data)) {
          hson.print();
        }
      }
    }
  }

  console.log('done');
}).catch(console.error);