import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * A horizontal step-based progress bar.
 * @param {object} props
 * @param {string[]} props.steps - The labels for each step.
 * @param {number} props.currentStep - Zero-based index of the current step.
 */
function ProgressBar({ steps, currentStep }) {
  return (
    <div className="progress-container">
      {steps.map((step, index) => {
        const stepClass = index <= currentStep ? 'progress-step active' : 'progress-step';
        return (
          <div className={stepClass} key={index}>
            <div className="progress-icon">{index + 1}</div>
            <div className="progress-label">{step}</div>
            {index < steps.length - 1 && (
              <div className={`progress-line ${index < currentStep ? 'active-line' : ''}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  // Track if we’ve started a study yet
  const [studyStarted, setStudyStarted] = useState(false);

  // Basic fields for the study
  const [studyGoal, setStudyGoal] = useState('');
  const [studyCriteria, setStudyCriteria] = useState('');
  const [numAgents, setNumAgents] = useState(3);

  // Chat history: an array of message objects { sender: 'user'|'agent', text: string }
  const [messages, setMessages] = useState([]);

  // Step-based progress: 0 to steps.length - 1
  // Steps:
  //   0: Creating UserAgents
  //   1: UserAgents performing tasks
  //   2: Surveying UserAgents
  //   3: Generating insights
  //   4: Done
  const [currentStep, setCurrentStep] = useState(-1);

  // Define the labels for the progress steps
  const progressSteps = [
    'Creating UserAgents',
    'UserAgents performing tasks',
    'Surveying UserAgents',
    'Generating insights',
    'Done',
  ];

  // Handle starting the study
  const handleStartStudy = (e) => {
    e.preventDefault();
    if (!studyGoal.trim() || !studyCriteria.trim()) return;

    setStudyStarted(true);
    setCurrentStep(0);

    // Initialize chat with an "agent" message summarizing the request
    const firstAgentMsg = {
      sender: 'agent',
      text: `Understood! You want to run a UX study on:\n\n"${studyGoal}"\n\nCriteria:\n${studyCriteria}\n\nNumber of agents: ${numAgents}.\nI'll start right away!`,
    };
    setMessages([firstAgentMsg]);
  };

  // Simulate each phase using timeouts. In production, replace these with real events/callbacks.
  useEffect(() => {
    if (studyStarted && currentStep >= 0 && currentStep < progressSteps.length - 1) {
      // Move to the next step after some delay
      const timer = setTimeout(() => {
        // Advance the step
        setCurrentStep((prev) => prev + 1);

        // Also add a chat message for each step
        switch (currentStep) {
          case 0:
            addAgentMessage(
              `I'm creating ${numAgents} diverse UXUser agents now...`
            );
            break;
          case 1:
            addAgentMessage(
              `All ${numAgents} agents are performing the tasks. Screen recordings are in progress...`
            );
            break;
          case 2:
            addAgentMessage(
              `Surveying all ${numAgents} UserAgents to gather feedback...`
            );
            break;
          case 3:
            addAgentMessage(
              `Here are some actionable insights:\n1. Cart flow is confusing.\n2. Layout elements hamper checkout.\n3. Error feedback is insufficient.\n\nLet me know if you'd like more details or want to tag any @UXUser directly.`
            );
            break;
          default:
            break;
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [studyStarted, currentStep, progressSteps.length, numAgents]);

  // Function to add a new agent message to the chat
  const addAgentMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'agent', text }]);
  };

  // Handle user sending a message
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!currentUserMessage.trim()) return;

    // Add user message to chat
    const newMsg = { sender: 'user', text: currentUserMessage };
    setMessages((prev) => [...prev, newMsg]);
    const userInput = currentUserMessage; // capture before resetting
    setCurrentUserMessage('');

    // Simulate an immediate “UXAgent” reply (in real life, call an LLM backend)
    setTimeout(() => {
      // If user mentions “@UXUserX,” we simulate a user agent response
      const userAgentMention = userInput.match(/@UXUser\d+/);
      if (userAgentMention) {
        addAgentMessage(
          `${userAgentMention} says: "I encountered an issue with the layout on mobile, making it hard to find the checkout button."`
        );
      } else {
        // Generic fallback reply
        addAgentMessage(
          `UXAgent here: Thanks for your message! Let me know if you want more details or want to chat with a specific @UXUser.`
        );
      }
    }, 800);
  };

  return (
    <div className="app-wrapper">
      <div className="header-bar">
        <h1>UX Study Chat</h1>
      </div>

      {/* If study not started, show setup form. Otherwise, show progress bar + chat. */}
      {!studyStarted ? (
        <div className="setup-form">
          <h2>Set Up Your UX Study</h2>
          <form onSubmit={handleStartStudy}>
            <label>Study Goal:</label>
            <input
              type="text"
              value={studyGoal}
              onChange={(e) => setStudyGoal(e.target.value)}
              placeholder="e.g. Add a medicine to cart in https://www.truemeds.in/"
              required
            />

            <label>People Criteria:</label>
            <textarea
              value={studyCriteria}
              onChange={(e) => setStudyCriteria(e.target.value)}
              placeholder="e.g. People in tier2 towns in Rajasthan from low financial backgrounds"
              required
            />

            <label>Number of Agents:</label>
            <input
              type="number"
              min={1}
              value={numAgents}
              onChange={(e) => setNumAgents(parseInt(e.target.value))}
            />

            <button type="submit">Start Study</button>
          </form>
        </div>
      ) : (
        <div className="chat-container">
          {/* PROGRESS BAR */}
          <ProgressBar steps={progressSteps} currentStep={currentStep} />

          {/* CHAT MESSAGES */}
          <div className="chat-section">
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'agent-bubble'}`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* USER INPUT */}
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={currentUserMessage}
                onChange={(e) => setCurrentUserMessage(e.target.value)}
                placeholder="Type your message... (mention @UXUser1, etc.)"
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
