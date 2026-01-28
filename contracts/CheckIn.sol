// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CheckIn {
    error AlreadyCheckedIn();

    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public streak;

    event CheckedIn(address indexed user, uint256 day, uint256 streakCount);

    function checkIn() external {
        uint256 today = block.timestamp / 1 days;
        uint256 last = lastCheckInDay[msg.sender];

        if (last == today) {
            revert AlreadyCheckedIn();
        }

        if (last + 1 == today) {
            streak[msg.sender] += 1;
        } else {
            streak[msg.sender] = 1;
        }

        lastCheckInDay[msg.sender] = today;
        emit CheckedIn(msg.sender, today, streak[msg.sender]);
    }
}
