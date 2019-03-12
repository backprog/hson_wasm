#[macro_use] extern crate lazy_static;
#[macro_use] extern crate serde_derive;
#[macro_use] extern crate serde_json;
extern crate serde;
extern crate hson;

use std::panic;
use std::os::raw::*;
use std::mem;
use std::ffi::{CString, CStr};
use serde_json::Value;
use std::sync::Mutex;
use hson::{ Hson, Ops, Search, Cast, Debug };

lazy_static! {
    static ref HSON: Mutex<Hson> = Mutex::new(Hson::new());
}

extern {
    fn console(ptr: *const c_char);
}

#[no_mangle]
pub extern fn parse (data: *const c_char) -> *const c_char {
    let data = unsafe {
        match CStr::from_ptr(data).to_str() {
            Ok(s) => s,
            Err(e) => return wrap(to_error(e.to_string()))
        }
    };

    match HSON.lock().unwrap().parse(data) {
        Ok(()) => wrap(to_success(Value::Bool(true))),
        Err(e) => wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn stringify () -> *const c_char {
    wrap(to_success(Value::String(HSON.lock().unwrap().stringify())))
}

#[no_mangle]
pub extern fn search (query: *const c_char) -> *const c_char {
    #[derive(Serialize, Deserialize)]
    struct Ids { id: u64 };

    let query = unsafe {
        match CStr::from_ptr(query).to_str() {
            Ok(s) => s,
            Err(e) => return wrap(to_error(e.to_string()))
        }
    };

    match HSON.lock().unwrap().search(query) {
        Ok(v) => {
            let to_struct = v.iter().map(|id| Ids { id: *id }).collect::<Vec<Ids>>();
            wrap(to_success(Value::String(serde_json::to_string(&to_struct).unwrap())))
        },
        Err(e) => return wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn search_in (node_id: c_int, query: *const c_char) -> *const c_char {
    #[derive(Serialize, Deserialize)]
    struct Ids { id: u64 };

    let query = unsafe {
        match CStr::from_ptr(query).to_str() {
            Ok(s) => s,
            Err(e) => return wrap(to_error(e.to_string()))
        }
    };

    match HSON.lock().unwrap().search_in(node_id as u64, query) {
        Ok(v) => {
            let to_struct = v.iter().map(|id| Ids { id: *id }).collect::<Vec<Ids>>();
            wrap(to_success(Value::String(serde_json::to_string(&to_struct).unwrap())))
        },
        Err(e) => return wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn query (query: *const c_char) -> *const c_char {
    #[derive(Serialize, Deserialize)]
    struct JsObj {
        id: u64,
        key: String,
        value: String,
        kind: String,
        parent: u64,
        childs: Vec<u64>
    };
    let mut results = Vec::new();
    let mut h = HSON.lock().unwrap();
    let query = unsafe {
        match CStr::from_ptr(query).to_str() {
            Ok(s) => s,
            Err(e) => return wrap(to_error(e.to_string()))
        }
    };

    match h.search(query) {
        Ok(v) => {
            for id in v {
                if let Some(vx) = h.get_vertex(id) {
                    let target = JsObj {
                        id: vx.id,
                        key: vx.key_as_string().unwrap(),
                        value: vx.value_as_string().unwrap(),
                        kind: format!("{:?}", vx.kind),
                        parent: vx.parent,
                        childs: vx.childs
                    };

                    results.push(serde_json::to_value(target).unwrap());
                }
            }

            wrap(to_success(serde_json::to_value(results).unwrap()))
        },
        Err(e) => return wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn query_on (node_id: c_int, query: *const c_char) -> *const c_char {
    #[derive(Serialize, Deserialize)]
    struct JsObj {
        id: u64,
        key: String,
        value: String,
        kind: String,
        parent: u64,
        childs: Vec<u64>
    };
    let mut results = Vec::new();
    let mut h = HSON.lock().unwrap();
    let query = unsafe {
        match CStr::from_ptr(query).to_str() {
            Ok(s) => s,
            Err(e) => return wrap(to_error(e.to_string()))
        }
    };

    match h.search_in(node_id as u64, query) {
        Ok(v) => {
            for id in v {
                if let Some(vx) = h.get_vertex(id) {
                    let target = JsObj {
                        id: vx.id,
                        key: vx.key_as_string().unwrap(),
                        value: vx.value_as_string().unwrap(),
                        kind: format!("{:?}", vx.kind),
                        parent: vx.parent,
                        childs: vx.childs
                    };

                    results.push(serde_json::to_value(target).unwrap());
                }
            }

            wrap(to_success(serde_json::to_value(results).unwrap()))
        },
        Err(e) => return wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn insert (node_id: c_int, insert_pos: c_uint, data_to_insert: *const c_char) -> *const c_char {
    let data_to_insert = unsafe {
        match CStr::from_ptr(data_to_insert).to_str() {
            Ok(s) => s,
            Err(e) => return wrap(to_error(e.to_string()))
        }
    };

    match HSON.lock().unwrap().insert(node_id as u64, insert_pos as usize, data_to_insert) {
        Ok(()) => wrap(to_success(Value::Bool(true))),
        Err(e) => wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn remove (node_id: c_int) -> *const c_char {
    match HSON.lock().unwrap().remove(node_id as u64) {
        Ok(()) => wrap(to_success(Value::Bool(true))),
        Err(e) => wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn replace (node_id: c_int, data_to_insert: *const c_char) -> *const c_char {
    let data_to_insert = unsafe {
        match CStr::from_ptr(data_to_insert).to_str() {
            Ok(s) => s,
            Err(e) => return wrap(to_error(e.to_string()))
        }
    };

    match HSON.lock().unwrap().replace(node_id as u64, data_to_insert) {
        Ok(()) => wrap(to_success(Value::Bool(true))),
        Err(e) => wrap(to_error(e.to_string()))
    }
}

#[no_mangle]
pub extern fn is_child (parent_id: c_int, child_id: c_int) -> *const c_char {
    wrap(to_success(Value::Bool(HSON.lock().unwrap().is_descendant(parent_id as u64, child_id as u64))))
}

#[no_mangle]
pub extern fn get_formatted_data () -> *const c_char {
    wrap(to_success(Value::String(HSON.lock().unwrap().get_formatted_data())))
}

#[no_mangle]
pub extern fn alloc (size: usize) -> *mut c_void {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    return ptr as *mut c_void;
}

#[no_mangle]
pub extern fn dealloc (ptr: *mut c_void, cap: usize) {
    unsafe  {
        let _buf = Vec::from_raw_parts(ptr, 0, cap);
    }
}

#[no_mangle]
pub extern fn dealloc_str (ptr: *mut c_char) {
    unsafe {
        let _ = CString::from_raw(ptr);
    }
}

#[no_mangle]
pub extern fn debug () {
    panic::set_hook(Box::new(|panic_info| {
        if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            unsafe {
                console(wrap(to_error(s.clone())));
            }
        } else if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            unsafe {
                console(wrap(to_error(s.to_string())));
            }
        } else {
            unsafe {
                console(wrap(to_error(String::from("Panic occurred"))));
            }
        }

        if let Some(l) = panic_info.location() {
            unsafe {
                console(wrap(to_error(format!("{:?}", l))));
            }
        }
    }));
}

fn to_success (data: Value) -> String {
    #[derive(Serialize, Deserialize)]
    struct SuccessResponse {
        status: String,
        data: Value
    }

    let s = SuccessResponse {
        status: String::from("OK"),
        data
    };

    serde_json::to_string(&s).unwrap()
}

fn to_error (reason: String) -> String {
    #[derive(Serialize, Deserialize)]
    struct ErrResponse {
        status: String,
        reason: String
    }

    let e = ErrResponse {
        status: String::from("ERR"),
        reason
    };

    serde_json::to_string(&e).unwrap()
}

fn wrap (v: String) -> *const c_char {
    CString::new(v.as_bytes()).unwrap().into_raw()
}
