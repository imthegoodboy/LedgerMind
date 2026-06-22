use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Deserialize)]
struct ProtectedAction {
    agent_id: String,
    action: String,
    target: String,
    risk: String,
    requires_approval: bool,
    digest: String,
    payload: serde_json::Value,
}

#[derive(Serialize)]
struct ContractDecision {
    allowed: bool,
    function_name: &'static str,
    digest: String,
    policy: &'static str,
    reason: String,
}

fn verify(function_name: &'static str, input: &str, allow_high_risk: bool) -> String {
    let parsed = serde_json::from_str::<ProtectedAction>(input);
    let Ok(action) = parsed else {
        return serde_json::json!({
            "allowed": false,
            "function_name": function_name,
            "policy": "invalid-json",
            "reason": "input did not match LedgerMind protected action schema"
        })
        .to_string();
    };

    let mut hasher = Sha256::new();
    hasher.update(action.agent_id.as_bytes());
    hasher.update(action.action.as_bytes());
    hasher.update(action.target.as_bytes());
    hasher.update(action.risk.as_bytes());
    hasher.update(action.digest.as_bytes());
    hasher.update(action.payload.to_string().as_bytes());
    let recalculated = format!("{:x}", hasher.finalize());

    let allowed = action.risk != "high" || (allow_high_risk && !action.requires_approval);
    let decision = ContractDecision {
        allowed,
        function_name,
        digest: recalculated,
        policy: if allowed { "ledgermind-agent-scope-v1" } else { "approval-required" },
        reason: if allowed {
            "action is inside the agent permission boundary".to_string()
        } else {
            "high-risk action must be approved before execution".to_string()
        },
    };

    serde_json::to_string(&decision).unwrap_or_else(|_| "{\"allowed\":false}".to_string())
}

#[no_mangle]
pub extern "C" fn scan_receipt(input_ptr: *const u8, input_len: usize) -> *mut u8 {
    export_string(verify("scan-receipt", unsafe { input_str(input_ptr, input_len) }, false))
}

#[no_mangle]
pub extern "C" fn classify_expense(input_ptr: *const u8, input_len: usize) -> *mut u8 {
    export_string(verify("classify-expense", unsafe { input_str(input_ptr, input_len) }, false))
}

#[no_mangle]
pub extern "C" fn generate_report(input_ptr: *const u8, input_len: usize) -> *mut u8 {
    export_string(verify("generate-report", unsafe { input_str(input_ptr, input_len) }, false))
}

#[no_mangle]
pub extern "C" fn execute_approved_payment(input_ptr: *const u8, input_len: usize) -> *mut u8 {
    export_string(verify("execute-approved-payment", unsafe { input_str(input_ptr, input_len) }, true))
}

unsafe fn input_str<'a>(ptr: *const u8, len: usize) -> &'a str {
    let bytes = std::slice::from_raw_parts(ptr, len);
    std::str::from_utf8(bytes).unwrap_or("{}")
}

fn export_string(value: String) -> *mut u8 {
    let mut bytes = value.into_bytes();
    bytes.push(0);
    let ptr = bytes.as_mut_ptr();
    std::mem::forget(bytes);
    ptr
}
