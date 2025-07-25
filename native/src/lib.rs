use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub fn fast_add(a: u32, b: u32) -> u32 {
    a + b
}
