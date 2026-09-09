# lending-eligibility — TEE contract

Decides whether a user can be referred to a partner lender, from their age and
residency, **inside the T3N enclave**. Neither value reaches the FastAPI service
or Supabase: the browser posts them to a Next.js route, which forwards them
straight to this contract.

BajetBuddy is not the lender. This is referral eligibility, not a credit
decision — it applies the floor criteria partner lenders would apply anyway.

## Interface

`check-eligibility` takes JSON bytes and returns JSON bytes.

```jsonc
// in
{ "age": 30, "residency": "citizen" }        // citizen | pr | foreigner

// out
{ "eligible": true, "reason": "…", "audit_id": "le-<contract>-<seq>-<ts>" }
```

`reason` is user-facing copy. `audit_id` is built from host identifiers only
(`contract_id`, `seq_no`, `cluster_timestamp_secs`) — never from the applicant's
answers — and `seq_no` keys `idx:txs_by_did`, so it resolves back to the
transaction during an audit.

Bad input (unparseable JSON, unknown residency, an implausible age) returns
`Err`, which surfaces as a contract error rather than a silent "not eligible".
That distinction matters: a denial is an answer, a parse failure is a bug.

## Rules

| Condition | Outcome |
|---|---|
| age < 18 | not eligible — age of majority (Age of Majority Act 1971) |
| age > 70 | not eligible — typical lender cap at loan maturity |
| residency is foreigner | not eligible — partners require citizenship or PR |
| otherwise | eligible |

Bounds are inclusive: 18 and 70 both pass. They are constants at the top of
`src/eligibility.rs`.

## Capabilities

`wit/world.wit` imports only `tenant-context` (for the audit reference) and
`logging`. No `http`, no `kv-store` — the decision is pure computation, so the
contract has no outbound reach at all. **The WIT imports are the entire
capability set**, so keep this list minimal.

Logging records the outcome and the audit reference only. Logging `age` would
put it in cluster logs and defeat the reason this runs in an enclave.

## Build

```bash
rustup target add wasm32-wasip2
cargo test                                      # 11 native unit tests
cargo build --target wasm32-wasip2 --release
```

Artifact: `target/wasm32-wasip2/release/z_lending_eligibility.wasm`

**Verify it is a component, not a core module** — the wrong `crate-type` still
builds cleanly and only fails at load:

```bash
python3 -c "
b=open('target/wasm32-wasip2/release/z_lending_eligibility.wasm','rb').read(8)
print('component' if b[4:6]==b'\x0d\x00' else 'CORE MODULE — wrong crate-type')"
```

## ABI versions

`wit/world.wit` pins `host:tenant/tenant-context@1.0.0` and
`host:interfaces/logging@2.1.0`, matching the packages vendored in `wit/deps/`.
A contract importing a version its tenant world does not provide is refused **at
load**, not at compile. If the target cluster differs, update `world.wit` and
`wit/deps/` together.

## Register

Not automated here — registration needs a keyed, credited tenant DID and network
reach to the cluster. See `references/register-contract.md` in the
`t3n-adk-quickstart` skill for the verified flow. In short:

```typescript
const { name, contract_id } = await tenant.contracts.register({
  tail: "lending-eligibility",
  version: "0.1.0",
  wasm: await readFile(".../z_lending_eligibility.wasm"),   // bytes, not a path
});

await tenant.contracts.list();                      // name present?
await tenant.contracts.listDetailed();              // status "active"?
await tenant.contracts.execute("lending-eligibility", {
  version: "0.1.0",
  functionName: "check-eligibility",                // camelCase key, kebab-case value
  input: { age: 30, residency: "citizen" },
});
```

`register()` returns the canonical name as **`z:<tid>:lending-eligibility`**.
Use that in app code — `tee:` is the system-contract namespace, not yours.
