// 플랫폼 지갑 주소 (수수료 받는 곳)
export const PLATFORM_ADDRESS = "0x01570257212A6849CCf40C8E2CdF781603A29FBa"

// Polygon Amoy testnet USDC 주소
export const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"

// 수수료 %
export const PLATFORM_FEE_PCT = 5

// Escrow 상태
export const ESCROW_STATUS = {
  0: "CREATED",
  1: "LOCKED",
  2: "COMPLETED",
  3: "RELEASED",
  4: "DISPUTED",
  5: "REFUNDED",
} as const

// Escrow 상태 한국어
export const ESCROW_STATUS_KO = {
  0: "계약 생성",
  1: "진행 중",
  2: "완료 대기",
  3: "지급 완료",
  4: "분쟁 중",
  5: "환불됨",
} as const