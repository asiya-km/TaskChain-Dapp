# 🪙 TaskChain DApp — Rewarding Productivity with NFTs

### 🧠 Overview

**TaskChain** is a decentralized productivity dApp that lets users create, manage, and complete tasks — earning **NFT rewards** for consistent achievement.
It merges task management with blockchain transparency, offering a fair and gamified way to stay productive.

---

## 🚀 Key Features

| Functionality            | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| ➕ **Add Task**           | Create new personal or work-related tasks stored on-chain       |
| ✏️ **Edit Task**         | Update existing task titles or descriptions                     |
| ❌ **Delete Task**        | Permanently remove a task from your blockchain list             |
| ✅ **Mark as Complete**   | Mark tasks as done to earn progress points                      |
| 🪙 **NFT Rewards**       | Receive tiered NFTs (Bronze, Silver, Gold) for completing tasks |
| 🔗 **Wallet Connection** | Connect MetaMask wallet for secure transactions                 |
| 💎 **NFT Gallery**       | View all NFTs earned through task completion                    |

---

## 🧩 Smart Contract Structure

### **1. TaskChain.sol**

Handles core logic:

* Add, edit, delete, and complete tasks
* Maintain a mapping of user tasks
* Track completed task count per wallet
* Trigger **RewardNFT** minting upon milestone completion

### **2. RewardNFT.sol**

An ERC721 contract that mints achievement NFTs:

| Milestone          | NFT Tier        | Description          |
| ------------------ | --------------- | -------------------- |
| 1 task completed   | 🥉 Bronze Badge | First success        |
| 3 tasks completed  | 🥈 Silver Badge | Consistency rewarded |
| 5+ tasks completed | 🥇 Gold Badge   | Productivity master  |

---

## 🌐 NFT Metadata (IPFS)

NFT metadata is stored on **IPFS** for decentralization.

Example:

```json
{
  "name": "Silver Performer",
  "description": "Awarded for completing three tasks on TaskChain.",
  "image": "ipfs://bafkreifexamplehashofsilvernft"
}
```

---

## ⚙️ Tech Stack

| Component       | Technology                 |
| --------------- | -------------------------- |
| Frontend        | React + Vite               |
| Smart Contracts | Solidity + Hardhat         |
| Blockchain      | Ethereum (Sepolia Testnet) |
| Wallet          | MetaMask                   |
| NFT Storage     | IPFS / Pinata              |
| Hosting         | GitHub Pages               |

---

## 💻 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/asiya-km/TaskChain-Dapp.git
cd TaskChain-Dapp
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Connect MetaMask

* Add **Sepolia Testnet**
* Ensure your wallet has test ETH (use a Sepolia faucet)

### 4️⃣ Configure Contract Addresses

Update `/src/utils/provider.js`:

```js
export const TASKCHAIN_ADDRESS = "0x326e3077887A912eC4730b74719cDa1770bae3f8";
export const REWARDNFT_ADDRESS = "0xA4b8dA8E04228a580473a1f7575cbfB3C694f23c";
```

### 5️⃣ Run Locally

```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## 🌍 Deployment (GitHub Pages)

```bash
npm run build
npm install gh-pages --save-dev
npm run deploy
```

Your dApp will be live at:
👉 **[https://asiya-km.github.io/TaskChain-Dapp](https://asiya-km.github.io/TaskChain-Dapp)**

---

## 📜 Smart Contract Addresses

| Contract  | Address                                      | Network         |
| --------- | ------- -------------------------------------| --------------- |
| RewardNFT | *0xA4b8dA8E04228a580473a1f7575cbfB3C694f23c* | Sepolia Testnet |
| TaskChain | *0x326e3077887A912eC4730b74719cDa1770bae3f8* | Sepolia Testnet |

---

## 🧠 How It Works (Flow Diagram)

```
User → Wallet (MetaMask)
     ↓
React Frontend (TaskChain UI)
     ↓
TaskChain.sol (Add/Edit/Delete/Complete)
     ↓
RewardNFT.sol (Mint Reward NFT)
     ↓
NFT Gallery (View Your Achievements)
```

---

## 📸 Demo

* 🌐 **Live dApp:** [https://asiya-km.github.io/TaskChain-Dapp](https://asiya-km.github.io/TaskChain-Dapp)
* 💻 **Code Repository:** [GitHub](https://github.com/asiya-km/TaskChain-Dapp)
* 🔗 **Smart Contracts:** [Sepolia Etherscan](https://sepolia.etherscan.io/)


---
