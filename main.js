const rust = import('./pkg/hson_wasm');

rust.then(m => {
  console.log(m.parse(`{
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
  }`));
  console.log(m.get_formatted_data());

  const searchTypedArray = new Uint32Array(m.search("p").buffer);
  const searchResults = Array.from(searchTypedArray).filter((i) => {
    return i > 0;
  });
  console.log(searchResults);

  const searchInTypedArray = new Uint32Array(m.search_in(BigInt(searchResults[0]), "attrs").buffer);
  const searchInResults = Array.from(searchInTypedArray).filter((i) => {
    return i > 0;
  });
  console.log(searchInResults);

  console.log(m.stringify());

  console.log(m.query("p"));

  console.log(m.is_descendant(BigInt(searchResults[0]), BigInt(searchInResults[0])));

  console.log(m.replace(BigInt(searchResults[1]), `{
    "ul": {
      "li": {
        "text": "World"
      }
    }
  }`));

  console.log(m.get_formatted_data());
}).catch(console.error);