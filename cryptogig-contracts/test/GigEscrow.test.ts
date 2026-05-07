import { expect } from "chai"
import { ethers } from "hardhat"

describe("GigEscrow", () => {

  let client:     any
  let freelancer: any
  let platform:   any
  let mockUSDC:   any
  let escrow:     any

  const AMOUNT  = ethers.parseUnits("500", 6) // 500 USDC
  const FEE_PCT = 5

  beforeEach(async () => {
    [client, freelancer, platform] = await ethers.getSigners()

    // 가짜 USDC 배포
    const MockERC20 = await ethers.getContractFactory("MockERC20")
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6)

    // 클라이언트한테 1000 USDC 발행
    await mockUSDC.mint(client.address, ethers.parseUnits("1000", 6))

    // Escrow 배포
    const GigEscrow = await ethers.getContractFactory("GigEscrow")
    escrow = await GigEscrow.deploy(
      client.address,
      freelancer.address,
      platform.address,
      await mockUSDC.getAddress(),
      AMOUNT,
      FEE_PCT
    )
  })

  it("정상 플로우: lock → complete → release", async () => {
    // 클라이언트가 Escrow에 USDC 사용 허락
    await mockUSDC.connect(client).approve(await escrow.getAddress(), AMOUNT)

    // lock
    await escrow.connect(client).lock()
    expect(await escrow.getStatus()).to.equal(1) // LOCKED

    // complete
    await escrow.connect(freelancer).complete()
    expect(await escrow.getStatus()).to.equal(2) // COMPLETED

    // release
    await escrow.connect(client).release()
    expect(await escrow.getStatus()).to.equal(3) // RELEASED

    // 프리랜서 475 USDC 받았는지 확인
    const freelancerBalance = await mockUSDC.balanceOf(freelancer.address)
    expect(freelancerBalance).to.equal(ethers.parseUnits("475", 6))

    // 플랫폼 25 USDC 받았는지 확인
    const platformBalance = await mockUSDC.balanceOf(platform.address)
    expect(platformBalance).to.equal(ethers.parseUnits("25", 6))
  })

  it("권한 없는 사람이 release 시도 → 실패", async () => {
    await mockUSDC.connect(client).approve(await escrow.getAddress(), AMOUNT)
    await escrow.connect(client).lock()
    await escrow.connect(freelancer).complete()

    await expect(
      escrow.connect(freelancer).release()
    ).to.be.revertedWith("Not client")
  })

  it("분쟁 신청", async () => {
    await mockUSDC.connect(client).approve(await escrow.getAddress(), AMOUNT)
    await escrow.connect(client).lock()

    await escrow.connect(freelancer).dispute()
    expect(await escrow.getStatus()).to.equal(4) // DISPUTED
  })
})