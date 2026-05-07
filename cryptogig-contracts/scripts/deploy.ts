import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("배포 주소:", deployer.address)

  const balance = await deployer.provider.getBalance(deployer.address)
  console.log("잔액:", ethers.formatEther(balance), "MATIC")

  // Amoy testnet USDC 주소
  const USDC_AMOY  = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
  const PLATFORM   = deployer.address
  const CLIENT     = deployer.address // 테스트용
  const FREELANCER = deployer.address // 테스트용
  const AMOUNT     = ethers.parseUnits("1", 6) // 1 USDC
  const FEE_PCT    = 5

  console.log("배포 중...")

  const GigEscrow = await ethers.getContractFactory("GigEscrow")
  const escrow = await GigEscrow.deploy(
    CLIENT,
    FREELANCER,
    PLATFORM,
    USDC_AMOY,
    AMOUNT,
    FEE_PCT
  )

  await escrow.waitForDeployment()
  console.log("✅ GigEscrow 배포 완료:", await escrow.getAddress())
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})