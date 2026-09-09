wit_bindgen::generate!({
    world: "lending-eligibility",
    path: "wit",
    additional_derives: [
        serde::Deserialize,
        serde::Serialize,
    ],
    generate_all,
});

// The decision logic is reached through the wasm-gated Guest impl below, so on
// a plain native build nothing calls it. Keeping it compiled for `test` is the
// point of the "lib" crate-type — it is what makes the rules unit-testable.
#[cfg(any(target_arch = "wasm32", test))]
mod eligibility;

#[cfg(target_arch = "wasm32")]
struct Component;

/// Correlation reference for this decision. Built from host-supplied
/// identifiers only — never from the applicant's answers, which must not leave
/// the enclave in any form. `seq_no` keys `idx:txs_by_did`, so the reference
/// resolves back to the transaction during an audit.
#[cfg(target_arch = "wasm32")]
fn audit_id() -> String {
    use crate::host::tenant::tenant_context;
    format!(
        "le-{}-{}-{}",
        tenant_context::contract_id(),
        tenant_context::seq_no(),
        tenant_context::cluster_timestamp_secs(),
    )
}

#[cfg(target_arch = "wasm32")]
impl exports::z::lending_eligibility::contracts::Guest for Component {
    fn check_eligibility(
        req: exports::z::lending_eligibility::contracts::GenericInput,
    ) -> Result<Vec<u8>, String> {
        use crate::host::interfaces::logging;

        let input = req.input.ok_or("check-eligibility: missing input")?;
        let audit_id = audit_id();

        let result = eligibility::check(&input, audit_id.clone());

        // Log the outcome and the reference, never the answers — age and
        // residency in a cluster log would defeat the point of the enclave.
        let _ = match &result {
            Ok(_) => logging::info(&format!("eligibility decided ({audit_id})")),
            Err(e) => logging::error(&format!("eligibility failed ({audit_id}): {e}")),
        };

        result
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);
