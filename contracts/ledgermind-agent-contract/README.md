# LedgerMind Terminal3 Contract

This folder contains the tenant contract source model for the LedgerMind protected-action flow.

The deployed Next app calls Terminal3 with this canonical action shape:

```json
{
  "script_name": "z:<tenant>:ledgermind-expense-contracts",
  "script_version": "latest",
  "function_name": "scan-receipt | classify-expense | generate-report | execute-approved-payment",
  "input": {
    "agent_id": "receipt-agent",
    "action": "scan receipt and create expense",
    "target": "vendor",
    "risk": "low",
    "requires_approval": false,
    "digest": "sha256",
    "payload": {}
  }
}
```

For production registration, compile the Rust/WIT contract to WASM, publish it through `TenantClient.contracts.publish`, and set:

- `T3N_CONTRACT_SCRIPT`
- `T3N_CONTRACT_VERSION`

If those variables are absent or the contract is not registered, the app still authenticates with Terminal3 and records a degraded proof instead of pretending the contract executed.
