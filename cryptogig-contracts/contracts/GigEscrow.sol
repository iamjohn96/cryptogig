// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GigEscrow is ReentrancyGuard {

    // ─── 상태 정의 ───────────────────────────────
    enum Status {
        CREATED,    // 계약 생성됨
        LOCKED,     // USDC 입금 완료, 작업 진행 중
        COMPLETED,  // 프리랜서 완료 신호
        RELEASED,   // 클라이언트 승인, 지급 완료
        DISPUTED,   // 분쟁 발생
        REFUNDED    // 환불 완료
    }

    // ─── 변수 ────────────────────────────────────
    address public client;
    address public freelancer;
    address public platform;
    IERC20  public usdc;

    uint256 public amount;
    uint8   public platformFeePct;
    Status  public status;

    // ─── 이벤트 ──────────────────────────────────
    event Locked(address indexed client, uint256 amount);
    event Completed(address indexed freelancer);
    event Released(address indexed freelancer, uint256 payout);
    event Disputed(address indexed initiator);
    event Refunded(address indexed client);

    // ─── modifier ────────────────────────────────
    modifier onlyClient() {
        require(msg.sender == client, "Not client");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Not freelancer");
        _;
    }

    modifier inStatus(Status _status) {
        require(status == _status, "Invalid status");
        _;
    }

    // ─── 생성자 ───────────────────────────────────
    constructor(
        address _client,
        address _freelancer,
        address _platform,
        address _usdc,
        uint256 _amount,
        uint8   _platformFeePct
    ) {
        require(_platformFeePct <= 20, "Fee too high");
        client         = _client;
        freelancer     = _freelancer;
        platform       = _platform;
        usdc           = IERC20(_usdc);
        amount         = _amount;
        platformFeePct = _platformFeePct;
        status         = Status.CREATED;
    }

    // ─── 핵심 함수들 ──────────────────────────────

    // 1. 클라이언트가 USDC 입금
    function lock() external onlyClient inStatus(Status.CREATED) nonReentrant {
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        status = Status.LOCKED;
        emit Locked(msg.sender, amount);
    }

    // 2. 프리랜서가 완료 신호
    function complete() external onlyFreelancer inStatus(Status.LOCKED) {
        status = Status.COMPLETED;
        emit Completed(msg.sender);
    }

    // 3. 클라이언트 승인 → 자동 지급
    function release() external onlyClient inStatus(Status.COMPLETED) nonReentrant {
        status = Status.RELEASED;

        uint256 fee    = (amount * platformFeePct) / 100;
        uint256 payout = amount - fee;

        require(usdc.transfer(freelancer, payout), "Payout failed");
        require(usdc.transfer(platform,   fee),    "Fee transfer failed");

        emit Released(freelancer, payout);
    }

    // 4. 분쟁 신청 (양쪽 다 가능)
    function dispute() external inStatus(Status.LOCKED) {
        require(
            msg.sender == client || msg.sender == freelancer,
            "Not a party"
        );
        status = Status.DISPUTED;
        emit Disputed(msg.sender);
    }

    // 5. 환불 (작업 시작 전)
    function refund() external onlyClient inStatus(Status.CREATED) {
        status = Status.REFUNDED;
        emit Refunded(client);
    }

    // ─── 조회 함수 ────────────────────────────────
    function getStatus() external view returns (Status) {
        return status;
    }

    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}