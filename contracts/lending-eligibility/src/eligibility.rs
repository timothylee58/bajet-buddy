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
fn decide(age: u32, residency: &str) -> Result<Decision, String> {
    if age >= IMPLAUSIBLE_AGE_YEARS {
        return Err(format!("age {age} is out of range"));
    }

    let Some(residency) = Residency::parse(residency) else {
        return Err(format!("unrecognised residency: {residency:?}"));
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
    let req: EligibilityRequest =
        serde_json::from_slice(input).map_err(|e| format!("invalid request: {e}"))?;

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
}
