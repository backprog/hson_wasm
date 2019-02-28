#[macro_use]
extern crate lazy_static;

extern crate js_sys;
extern crate wasm_bindgen;
extern crate hson;

use std::sync::Mutex;
use js_sys::*;
use wasm_bindgen::prelude::*;
use hson::{ Hson, Ops, Search, Cast, Debug };

lazy_static! {
    static ref HSON: Mutex<Hson> = Mutex::new(Hson::new());
}

#[wasm_bindgen]
extern "C" {
    type Property;

    #[wasm_bindgen(method, getter)]
    fn value (this: &Property) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_value (this: &Property, val: String);
}


#[wasm_bindgen]
pub fn parse (data: &str) -> Result<bool, JsValue> {
    match HSON.lock().unwrap().parse(data) {
        Ok(()) => Ok(true),
        Err(e) => Err(JsValue::from_str(&format!("{}", e)))
    }
}

#[wasm_bindgen]
pub fn stringify () -> String {
    HSON.lock().unwrap().stringify()
}

#[wasm_bindgen]
pub fn search (query: &str) -> Vec<u64> {
    match HSON.lock().unwrap().search(query) {
        Ok(v) => v,
        Err(_e) => Vec::new()
    }
}

#[wasm_bindgen]
pub fn search_in (node_id: u64, query: &str) -> Vec<u64> {
    match HSON.lock().unwrap().search_in(node_id, query) {
        Ok(v) => v,
        Err(_e) => Vec::new()
    }
}

#[wasm_bindgen]
pub fn query (query: &str) -> Vec<JsValue> {
    let mut results = Vec::new();
    let mut h = HSON.lock().unwrap();

    match h.search(query) {
        Ok(v) => {
            for id in v {
                if let Some(vx) = h.get_vertex(id) {
                    let target = Object::new();

                    set_int_property(&target, "id", vx.id);
                    set_str_property(&target, "key", &vx.key_as_string().unwrap());
                    set_str_property(&target, "value", &vx.value_as_string().unwrap());
                    set_str_property(&target, "type", &format!("{:?}", vx.kind));
                    set_int_property(&target, "parent", vx.parent);
                    set_str_property(&target, "childs", &vx.childs.iter()
                                                                            .map(|i| i.to_string())
                                                                            .collect::<Vec<String>>()
                                                                            .join(","));

                    results.push(JsValue::from(target));
                }
            }

            results
        },
        Err(_e) => results
    }
}

#[wasm_bindgen]
pub fn query_on (node_id: u64, query: &str) -> Vec<JsValue> {
    let mut results = Vec::new();
    let mut h = HSON.lock().unwrap();

    match h.search_in(node_id, query) {
        Ok(v) => {
            for id in v {
                if let Some(vx) = h.get_vertex(id) {
                    let target = Object::new();

                    set_int_property(&target, "id", vx.id);
                    set_str_property(&target, "key", &vx.key_as_string().unwrap());
                    set_str_property(&target, "value", &vx.value_as_string().unwrap());
                    set_str_property(&target, "type", &format!("{:?}", vx.kind));
                    set_int_property(&target, "parent", vx.parent);
                    set_str_property(&target, "childs", &vx.childs.iter()
                                                                            .map(|i| i.to_string())
                                                                            .collect::<Vec<String>>()
                                                                            .join(","));

                    results.push(JsValue::from(target));
                }
            }

            results
        },
        Err(_e) => results
    }
}

#[wasm_bindgen]
pub fn insert (node_id: u64, idx: usize, s: &str) -> Result<bool, JsValue> {
    match HSON.lock().unwrap().insert(node_id, idx, s) {
        Ok(()) => Ok(true),
        Err(e) => Err(JsValue::from_str(&format!("{}", e)))
    }
}

#[wasm_bindgen]
pub fn remove (node_id: u64) -> Result<bool, JsValue> {
    match HSON.lock().unwrap().remove(node_id) {
        Ok(()) => Ok(true),
        Err(e) => Err(JsValue::from_str(&format!("{}", e)))
    }
}

#[wasm_bindgen]
pub fn replace (node_id: u64, data_to_insert: &str) -> Result<bool, JsValue> {
    match HSON.lock().unwrap().replace(node_id, data_to_insert) {
        Ok(()) => Ok(true),
        Err(e) => Err(JsValue::from_str(&format!("{}", e)))
    }
}

#[wasm_bindgen]
pub fn is_descendant (node_id: u64, child_id: u64) -> bool {
    HSON.lock().unwrap().is_descendant(node_id, child_id)
}

#[wasm_bindgen]
pub fn get_formatted_data () -> String {
    HSON.lock().unwrap().get_formatted_data()
}


fn set_str_property (target: &Object, key: &str, val: &str) -> Object {
    let key = JsValue::from_str(key);
    let value = Property::from(JsValue::from(Object::new()));
    value.set_value(val.to_string());
    let descriptor = Object::from(JsValue::from(value));
    Object::define_property(target, &key, &descriptor)
}

fn set_int_property (target: &Object, key: &str, val: u64) -> Object {
    let key = JsValue::from_str(key);
    let value = Property::from(JsValue::from(Object::new()));
    value.set_value(val.to_string());
    let descriptor = Object::from(JsValue::from(value));
    Object::define_property(target, &key, &descriptor)
}