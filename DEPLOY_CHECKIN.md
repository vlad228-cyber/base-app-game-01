# Check-In Contract (Gasless)

This app uses a simple `CheckIn` contract so the Paymaster can allowlist a
single contract call and sponsor gas.

## 1) Install deps

```bash
npm install
```

## 2) Configure environment

Add these to your `.env` (do not commit private keys):

```
BASE_RPC_URL="https://mainnet.base.org"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
BASE_PRIVATE_KEY="YOUR_PRIVATE_KEY"
```

You already have:

```
NEXT_PUBLIC_ONCHAINKIT_API_KEY="CDP_API_KEY_ID"
NEXT_PUBLIC_PAYMASTER_URL="https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY"
```

## 3) Deploy

Mainnet:

```bash
npm run deploy:checkin:base
```

Sepolia:

```bash
npm run deploy:checkin:sepolia
```

Copy the deployed address.

## 4) Update app env

```
NEXT_PUBLIC_CHECKIN_CONTRACT="0xYourDeployedContract"
```

Restart `npm run dev`.

## 5) Allowlist in Paymaster (CDP)

In the CDP Paymaster settings:

- Add the deployed contract address.
- Allow function `checkIn()` (no args).
- Set spend limits.

After allowlisting, gasless check-ins should work with `isSponsored`.
