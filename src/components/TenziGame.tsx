import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import useSound from "use-sound";
import clickSound from "../sounds/click.wav";
import winSound from "../sounds/win.mp3";
import rollSound from "../sounds/roll.wav";
import { v4 as uuidv4 } from "uuid";
import { FaEdit } from "react-icons/fa";

const NUM_DICE = 10;

const generateNewDie = () => ({
  value: Math.ceil(Math.random() * 6),
  isHeld: false,
  id: uuidv4(),
});

const generateDice = (difficulty: number) =>
  Array.from({ length: difficulty }, generateNewDie);

const saveToLocalStorage = (name: string, time: number) => {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  leaderboard.push({ name, time });
  leaderboard.sort((a: any, b: any) => a.time - b.time);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0, 5)));
};

export default function TenziGame() {
  const [difficulty, setDifficulty] = useState(NUM_DICE);
  const [dice, setDice] = useState(generateDice(NUM_DICE));
  const [hasWon, setHasWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [name, setName] = useState(localStorage.getItem("playerName") || "");
  const [inputName, setInputName] = useState("");
  const [showGoPopup, setShowGoPopup] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [confettiIntervalId, setConfettiIntervalId] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  const [playClick] = useSound(clickSound);
  const [playWin] = useSound(winSound);
  const [playRoll] = useSound(rollSound);

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let interval: any;
    if (running) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    const allHeld = dice.every((die) => die.isHeld);
    const firstVal = dice[0].value;
    const allSame = dice.every((die) => die.value === firstVal);
    if (allHeld && allSame) {
      setRunning(false);
      setHasWon(true);
      setShowWinPopup(true);
      speak("Tenzie!");
      // confetti();
      playWin();
      const id = setInterval(() => {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 500);
      setConfettiIntervalId(id);

      saveToLocalStorage(name, timer);
      setTimeout(() => setShowWinPopup(false), 2000);
    }
  }, [dice]);

  const rollDice = () => {
    if (!running && !hasWon) {
      setRunning(true);
      setShowGoPopup(true);
      speak("Goooo!");
      playRoll();
      setTimeout(() => setShowGoPopup(false), 1000);
    }
    if (!hasWon) {
      setDice((old) => old.map((d) => (d.isHeld ? d : generateNewDie())));
      playRoll();
    } else {
      setShowConfirmReset(true);
    }
  };

  const confirmReset = () => {
    if (confettiIntervalId) clearInterval(confettiIntervalId);
    setConfettiIntervalId(null);

    setDice(generateDice(difficulty));
    setTimer(0);
    setHasWon(false);
    setShowConfirmReset(false);
  };

  const fullReset = () => {
    confirmReset();
    localStorage.removeItem("leaderboard");
  };

  const holdDie = (id: string) => {
    playClick();

    if (!running && !hasWon) {
      setRunning(true);
      setShowGoPopup(true);
      speak("Goooo!");
      playRoll();
      setTimeout(() => setShowGoPopup(false), 1000);
    }

    setDice((old) =>
      old.map((d) => (d.id === id ? { ...d, isHeld: !d.isHeld } : d))
    );
  };

  const handleNameSubmit = () => {
    if (inputName.trim()) {
      localStorage.setItem("playerName", inputName.trim());
      setName(inputName.trim());
      setEditingName(false);
    }
  };

  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const listVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delayChildren: 0.5,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-white" : "bg-[#533B4D] text-[#FAE3C6]"
      } min-h-screen flex flex-col items-center justify-center px-4 py-8`}
    >
      <button
        onClick={() => setDarkMode((prev) => !prev)}
        className="absolute top-4 right-4 px-4 py-2 rounded bg-[#F564A9] dark:bg-gray-700"
      >
        Toggle {darkMode ? "Light" : "Dark"} Mode
      </button>

      {!name || editingName ? (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl font-bold mb-4">Welcome to TENZI GAME!</h1>
          <h3 className="text-[#f564A9] text-[2rem]">
            God's dice always have a lucky roll.
          </h3>

          <motion.p
            className="mb-4 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Roll dice until all show the same number. You can hold dice between
            rolls. The fewer the rolls and time, the better!
          </motion.p>

          <motion.ul
            className="text-left inline-block text-sm mt-2 space-y-2"
            initial="hidden"
            animate="visible"
            variants={listVariants}
          >
            {[
              {
                label: "🎯 Goal",
                content: "Match all dice to the same number.",
              },
              {
                label: "🧩 How to Play",
                content: (
                  <ul className="ml-4 list-disc">
                    <li>
                      Click <b>Roll Dice</b> to roll all dice.
                    </li>
                    <li>Click a dice to hold its value.</li>
                    <li>Repeat until all dice match.</li>
                  </ul>
                ),
              },
              {
                label: "🏆 Win",
                content: "All dice show the same value.",
              },
              {
                label: "📈 Score",
                content: "Time and rolls matter!",
              },
            ].map((item, idx) => (
              <motion.li key={idx} variants={itemVariants}>
                <b className="text-[#F564A9]">{item.label}:</b> {item.content}
              </motion.li>
            ))}
          </motion.ul>

          <input
            className="px-4 py-2 rounded border border-[#F564A9] mb-4 text-[#FAA4BD] mt-4 outline-none"
            placeholder="Your name?"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
          />
          <br />
          <button
            onClick={handleNameSubmit}
            className="mt-2 px-6 py-2 rounded text-[#FAE3C6] font-bold bg-gradient-to-r from-[#F564A9] to-[#FAA4BD]"
          >
            Proceed to your TENZI game
          </button>
        </motion.div>
      ) : (
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2 text-[#FAA4BD]">
            Welcome, {name}!
            <FaEdit
              className="cursor-pointer text-[#F564A9] hover:text-pink-500"
              onClick={() => setEditingName(true)}
            />
          </h1>
          <p className="mb-4 text-[#F564A9]">Timer: {timer}s</p>

          <div className="mb-4">
            <label className="mr-2 font-semibold text-2xl">
              Select Difficulty:
            </label>
            <select
              value={difficulty}
              onChange={(e) => {
                const diff = parseInt(e.target.value);
                setDifficulty(diff);
                setDice(generateDice(diff));
              }}
              className=" px-2 py-1 rounded bg-[#FAE3C6] text-[#533B4D]"
            >
              <option value={5}>Easy (5 Dice)</option>
              <option value={10}>Normal (10 Dice)</option>
              <option value={15}>Hard (15 Dice)</option>
            </select>
          </div>

          {showGoPopup && (
            <div className="text-[#FAA4BD] font-bold text-3xl mb-2">
              GOOOO!!!!
            </div>
          )}
          {showWinPopup && (
            <div className="text-green-600 font-bold text-3xl mb-2">
              TENZIE!!!!
            </div>
          )}

          <div className="flex justify-center mb-4 mt-8">
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-4 mt-8`}
            >
              {dice.map((die) => {
                const heldValue = dice.find((d) => d.isHeld)?.value;
                const isMismatch =
                  heldValue !== undefined &&
                  !die.isHeld &&
                  die.value !== heldValue;

                return (
                  <motion.div
                    key={die.id}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => holdDie(die.id)}
                    className={`w-16 h-16 flex items-center justify-center rounded shadow cursor-pointer transition-colors p-2
        ${die.isHeld ? "bg-[#F564A9]" : "bg-white"}
        ${
          isMismatch ? "border-4 border-red-500" : "border-2 border-transparent"
        }
      `}
                  >
                    <img
                      src={`/dice-${die.value}.png`}
                      alt={`dice-${die.value}`}
                      className="w-full h-full"
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <button
            onClick={rollDice}
            className="mt-4 px-6 py-2 bg-pink-400 text-white rounded shadow hover:bg-pink-500"
          >
            {hasWon ? "New Game" : "Roll Dice"}
          </button>

          {showConfirmReset && (
            <div className="mt-4">
              <p className="mb-2 font-semibold">
                Are you sure you want to start a new game?
              </p>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-green-500 text-white rounded mr-2"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                No
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={fullReset}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Reset Game & Leaderboard
            </button>
          </div>

          {leaderboard.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-[#F564A9]">
                🏆 Leaderboard
              </h2>
              <ul className="mt-2 text-left bg-[#FAE3C6] border-2 border-[#F564A9] text-[#533B4D] p-4 rounded-xl">
                {leaderboard.map((entry: any, i: number) => (
                  <li key={i} className="text-lg p-4">
                    {i + 1}. {entry.name} - {entry.time}s
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
