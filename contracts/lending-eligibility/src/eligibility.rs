use serde::{Deserialize, Serialize};

/// Age of majority in Malaysia (Age of Majority Act 1971) — below this nobody
/// can enter a credit agreement, so no partner referral is possible.
const MIN_AGE_YEARS: u32 = 18;

/// Typical maximum age at loan maturity across Malaysian personal-loan
/// providers. Above it the referral would be declined downstream anyway.
const MAX_AGE_YEARS: u32 = 70;

/// Beyond this an age is a data-entry error, not a person. Rejected as bad
/// input rather than silently answered "not eligible".
const IMPLAUSIBLE_AGE_YEARS: u32 = 130;

#[derive(Debug, Deserialize)]
pub struct EligibilityRequest {
    pub age: u32,
    pub residency: String,
}

#[derive(Debug, Serialize)]
pub struct EligibilityResponse {
    pub eligible: bool,
    pub reason: String,
    pub audit_id: String,
}

#[derive(Debug, PartialEq, Eq)]
enum Residency {
    Citizen,
    PermanentResident,
    Foreigner,
}

impl Residency {
    fn parse(raw: &str) -> Option<Self> {
        match raw.trim().to_ascii_lowercase().replace(['-', ' '], "_").as_str() {
            "citizen" | "my" | "malaysian" => Some(Self::Citizen),
            "pr" | "permanent_resident" => Some(Self::PermanentResident),
            "foreigner" | "non_resident" | "expat" => Some(Self::Foreigner),
            _ => None,
        }
    }
}

#[derive(Debug)]
pub struct Decision {
    pub eligible: bool,
    pub reason: String,
}

/// Pure referral-eligibility rules. No host calls, no I/O — the WASM boundary
/// stays in lib.rs so this stays unit-testable on the native target.
/// Error strings must never interpolate the applicant's answers: they are
/// logged by the host and returned to the caller, so an interpolated value
/// leaves the enclave exactly as a leaked field would.
fn decide(age: u32, residency: &str) -> Result<Decision, String> {
    if age >= IMPLAUSIBLE_AGE_YEARS {
        return Err("age is out of range".to_string());
    }

    let Some(residency) = Residency::parse(residency) else {
        return Err("unrecognised residency".to_string());
    };

    if age < MIN_AGE_YEARS {
        return Ok(Decision {
            eligible: false,
            reason: format!("You must be at least {MIN_AGE_YEARS} to be referred to a lender."),
        });
    }

    if age > MAX_AGE_YEARS {
        return Ok(Decision {
            eligible: false,
            reason: format!("Partner lenders cap personal loans at age {MAX_AGE_YEARS} on maturity."),
        });
    }

    if residency == Residency::Foreigner {
        return Ok(Decision {
            eligible: false,
            reason: "Partner lenders require Malaysian citizenship or permanent residency.".to_string(),
        });
    }

    Ok(Decision {
        eligible: true,
        reason: "You meet the basic criteria for a partner loan referral.".to_string(),
    })
}

/// Parse the JSON request, apply the rules, serialise the response.
/// `audit_id` is supplied by the caller so this stays free of host calls.
pub fn check(input: &[u8], audit_id: String) -> Result<Vec<u8>, String> {
    // serde's Display echoes the offending value ("invalid value: integer -5"),
    // which here is applicant PII. Report only the position and category, which
    // is enough to debug a malformed payload without carrying its contents out.
    let req: EligibilityRequest = serde_json::from_slice(input).map_err(|e| {
        format!(
            "invalid request: {:?} at line {}, column {}",
            e.classify(),
            e.line(),
            e.column()
        )
    })?;

    let decision = decide(req.age, &req.residency)?;

    serde_json::to_vec(&EligibilityResponse {
        eligible: decision.eligible,
        reason: decision.reason,
        audit_id,
    })
    .map_err(|e| format!("failed to encode response: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn decide_ok(age: u32, residency: &str) -> Decision {
        decide(age, residency).expect("expected a decision, got an input error")
    }

    #[test]
    fn citizen_of_working_age_is_eligible() {
        assert!(decide_ok(30, "citizen").eligible);
    }

    #[test]
    fn permanent_resident_is_eligible() {
        assert!(decide_ok(30, "pr").eligible);
    }

    #[test]
    fn boundary_ages_are_inclusive() {
        assert!(decide_ok(MIN_AGE_YEARS, "citizen").eligible, "18 must be eligible");
        assert!(decide_ok(MAX_AGE_YEARS, "citizen").eligible, "70 must be eligible");
        assert!(!decide_ok(MIN_AGE_YEARS - 1, "citizen").eligible, "17 must not be");
        assert!(!decide_ok(MAX_AGE_YEARS + 1, "citizen").eligible, "71 must not be");
    }

    #[test]
    fn foreigner_is_not_eligible_regardless_of_age() {
        assert!(!decide_ok(30, "foreigner").eligible);
    }

    #[test]
    fn residency_parsing_is_forgiving_about_case_and_separators() {
        for raw in ["Citizen", " MALAYSIAN ", "permanent-resident", "PERMANENT RESIDENT"] {
            assert!(decide_ok(30, raw).eligible, "{raw} should parse as eligible");
        }
    }

    #[test]
    fn unknown_residency_is_an_input_error_not_a_denial() {
        let err = decide(30, "martian").unwrap_err();
        assert!(err.contains("unrecognised residency"), "got: {err}");
    }

    #[test]
    fn implausible_age_is_an_input_error_not_a_denial() {
        let err = decide(IMPLAUSIBLE_AGE_YEARS, "citizen").unwrap_err();
        assert!(err.contains("out of range"), "got: {err}");
    }

    #[test]
    fn check_round_trips_json_and_carries_the_audit_id() {
        let out = check(br#"{"age":30,"residency":"citizen"}"#, "audit-123".into()).unwrap();
        let v: serde_json::Value = serde_json::from_slice(&out).unwrap();
        assert_eq!(v["eligible"], true);
        assert_eq!(v["audit_id"], "audit-123");
        assert!(v["reason"].as_str().unwrap().len() > 0);
    }

    #[test]
    fn check_rejects_malformed_json() {
        assert!(check(b"not json", "a".into()).unwrap_err().contains("invalid request"));
    }

    #[test]
    fn check_rejects_a_negative_age() {
        // u32 deserialisation refuses it — the rules never see a wrapped value.
        assert!(check(br#"{"age":-5,"residency":"citizen"}"#, "a".into()).is_err());
    }

    #[test]
    fn response_carries_no_input_fields() {
        // The whole point of running in the enclave: age and residency must not
        // travel back out in the response envelope.
        let out = check(br#"{"age":42,"residency":"pr"}"#, "a".into()).unwrap();
        let body = String::from_utf8(out).unwrap();
        assert!(!body.contains("42"), "age leaked into the response: {body}");
        assert!(!body.contains("\"residency\""), "residency leaked: {body}");
    }

    // Error strings are logged by the host and returned to the caller, so they
    // leave the enclave just as the response body does. Covering only the
    // success path above missed that, so cover every error path here.

    #[test]
    fn decide_errors_carry_no_input_values() {
        let err = decide(133, "citizen").unwrap_err();
        assert!(!err.contains("133"), "age leaked into an error: {err}");

        let err = decide(30, "atlantean").unwrap_err();
        assert!(!err.contains("atlantean"), "residency leaked into an error: {err}");
    }

    #[test]
    fn deserialisation_errors_carry_no_input_values() {
        // serde's own message would echo the rejected value; the wrapper must not.
        let err = check(br#"{"age":-987,"residency":"citizen"}"#, "a".into()).unwrap_err();
        assert!(!err.contains("987"), "age leaked via the serde error: {err}");

        let err = check(br#"{"age":"seventeen","residency":"citizen"}"#, "a".into()).unwrap_err();
        assert!(!err.contains("seventeen"), "value leaked via the serde error: {err}");
    }

    #[test]
    fn deserialisation_errors_still_locate_the_problem() {
        // Redaction must not cost all diagnostic value.
        let err = check(b"{ oops", "a".into()).unwrap_err();
        assert!(err.contains("line"), "error should carry a position: {err}");
        assert!(err.contains("column"), "error should carry a position: {err}");
    }
}
