import React, { useState, useEffect } from 'react'
import FallingCoin from './components/UI/FallingCoin'
import { ethers } from 'ethers'
import detectEthereumProvider from '@metamask/detect-provider'
import PolyLotteryABI from './json/PolyLotteryABI.json'
import lastWinnerData from './json/lastWinner.json'
import lotteryInfoData from './json/lotteryInfo.json'

const CONTRACT_ADDRESS = '0xf4e53F35b1e8665928518D1511BB1Ff3Fa30B791'

function App() {
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [ticketCount, setTicketCount] = useState<number>(1)
  const [lastWinner, setLastWinner] = useState<string>(lastWinnerData.address)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [fallingCoins, setFallingCoins] = useState<{ id: number; left: number }[]>([])
  const [totalPrize, setTotalPrize] = useState(lotteryInfoData.currentJackpot)
  const [ticketPrice, setTicketPrice] = useState(lotteryInfoData.ticketPrice)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const init = async () => {
      const provider = await detectEthereumProvider()
      if (provider) {
        const ethersProvider = new ethers.providers.Web3Provider(provider as any)
        const accounts = await ethersProvider.listAccounts()
        if (accounts.length > 0) {
          setUpContract(ethersProvider)
        }
      }
    }
    init()

    const timer = setInterval(() => {
      const now = new Date()
      const nextSunday = new Date(now)
      nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7)
      nextSunday.setHours(7, 0, 0, 0)
      
      const timeDiff = nextSunday.getTime() - now.getTime()
      
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft('Drawing now!')
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const setUpContract = async (ethersProvider: ethers.providers.Web3Provider) => {
    const signer = ethersProvider.getSigner()
    const lotteryContract = new ethers.Contract(CONTRACT_ADDRESS, PolyLotteryABI, signer)
    setContract(lotteryContract)
    setIsConnected(true)
    updateLotteryInfo(lotteryContract)
  }

  const connectWallet = async () => {
    try {
      const provider = await detectEthereumProvider()
      if (provider) {
        await (provider as any).request({ method: 'eth_requestAccounts' })
        const ethersProvider = new ethers.providers.Web3Provider(provider as any)
        setUpContract(ethersProvider)
      } else {
        alert('Please install MetaMask!')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Error connecting wallet. Please try again.')
    }
  }

  const updateLotteryInfo = async (lotteryContract: ethers.Contract) => {
    const balance = await lotteryContract.getLotteryBalance()
    setTotalPrize(ethers.utils.formatEther(balance))

    const price = await lotteryContract.ticketPrice()
    setTicketPrice(ethers.utils.formatEther(price))
  }

  const buyTickets = async () => {
    if (!contract) return
    try {
      const price = await contract.ticketPrice()
      const totalCost = price.mul(ticketCount)
      const tx = await contract.buyTickets(ticketCount, { value: totalCost })
      await tx.wait()
      alert('Tickets purchased successfully!')
      updateLotteryInfo(contract)
    } catch (error) {
      console.error('Error buying tickets:', error)
      alert('Error buying tickets. Please try again.')
    }
  }

  const adjustTicketCount = (amount: number) => {
    setTicketCount((prev) => Math.max(1, prev + amount));
    if (amount > 0) {
      const coinCount = Math.floor(Math.random() * 4) + 1; // Random number between 1 and 4
      const newCoins = Array.from({ length: coinCount }, () => ({
        id: Date.now() + Math.random(), // Ensure unique IDs
        left: Math.random() * window.innerWidth,
      }));
      setFallingCoins((prevCoins) => [...prevCoins, ...newCoins]);
    }
  };

  const removeCoin = (id: number) => {
    setFallingCoins((prevCoins) => prevCoins.filter((coin) => coin.id !== id));
  };

  return (
    <div className="bg-black min-h-screen text-white flex flex-col items-center justify-start p-4 w-full relative overflow-hidden">
      {fallingCoins.map((coin) => (
        <FallingCoin key={coin.id} left={coin.left} onFinish={() => removeCoin(coin.id)} />
      ))}
      <div className="absolute top-4 right-4">
        {!isConnected ? (
          <button
            className="bg-yellow-500 text-black px-4 py-2 rounded font-bold"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        ) : (
          <span className="text-green-400">Connected</span>
        )}
      </div>
      <h1 className="text-5xl font-bold mb-8 text-yellow-400 mt-8">TheLottery</h1>
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-semibold mb-2">Current Jackpot</h2>
          <p className="text-4xl font-bold text-green-400">{totalPrize} MATIC</p>
        </div>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold mb-2">Next Draw</h2>
          <p className="text-3xl font-bold text-blue-400">{timeLeft}</p>
        </div>
        <div className="flex justify-between mb-6 items-end">
          <div>
            <label htmlFor="ticketCount" className="block mb-2">Number of Tickets:</label>
            <div className="flex items-center">
              <button
                className="bg-gray-700 text-white px-3 py-2 rounded-l"
                onClick={() => adjustTicketCount(-1)}
              >
                -
              </button>
              <input
                type="number"
                id="ticketCount"
                value={ticketCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (!isNaN(value) && value >= 1) {
                    setTicketCount(value)
                  }
                }}
                className="bg-gray-700 text-white px-3 py-2 w-16 text-center"
                readOnly
              />
              <button
                className="bg-gray-700 text-white px-3 py-2 rounded-r"
                onClick={() => adjustTicketCount(1)}
              >
                +
              </button>
            </div>
          </div>
          <button
            className="bg-yellow-500 text-black px-6 py-2 rounded font-bold"
            onClick={buyTickets}
            disabled={!isConnected}
          >
            Buy Tickets ({(ticketCount * parseFloat(ticketPrice)).toFixed(4)} MATIC)
          </button>
        </div>
          {winningNumber !== null && (
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold mb-2">Winning Number:</h2>
              <div className="bg-yellow-400 text-black w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto">
                {winningNumber}
              </div>
            </div>
          )}
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Last Winner</h2>
            <p className="text-green-400 font-mono">{lastWinner}</p>
            <p className="text-xl font-bold mt-2">Congratulations!</p>
          </div>
        </div>
      </div>
  )
}

export default App