import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * A vertical step-based progress timeline with progress bars for in-progress steps.
 * @param {object} props
 * @param {string[]} props.steps - The labels for each step.
 * @param {number} props.currentStep - Zero-based index of the current step.
 */
function VerticalStepper({ steps, currentStep }) {
  return (
    <div className="stepper-container">
      {steps.map((step, index) => (
        <div
          className={`stepper-step ${index <= currentStep ? 'active' : ''}`}
          key={index}
        >
          <div className="stepper-icon">{index + 1}</div>
          <div className="stepper-content">
            <div className="stepper-label">{step}</div>
            {/* Show progress bar only when this is the current step */}
            {index === currentStep && (
              <div className="stepper-progress-bar">
                <div className="stepper-progress-fill"></div>
              </div>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`stepper-line ${index < currentStep ? 'active-line' : ''}`}></div>
          )}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [studyStarted, setStudyStarted] = useState(false);
  const [studyGoal, setStudyGoal] = useState('');
  const [studyCriteria, setStudyCriteria] = useState('');
  const [numAgents, setNumAgents] = useState(3);
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);

  const progressSteps = [
    'Creating UserAgents',
    'UserAgents performing tasks',
    'Surveying UserAgents',
    'Generating insights',
    'Done',
  ];

  const handleStartStudy = (e) => {
    e.preventDefault();
    if (!studyGoal.trim() || !studyCriteria.trim()) return;

    setStudyStarted(true);
    setCurrentStep(0);

    const firstAgentMsg = {
      sender: 'agent',
      text: `Understood! You want to run a UX study on:\n\n"${studyGoal}"\n\nCriteria:\n${studyCriteria}\n\nNumber of agents: ${numAgents}.\nI'll start right away!`,
    };
    setMessages([firstAgentMsg]);
  };

  useEffect(() => {
    if (studyStarted && currentStep >= 0 && currentStep < progressSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);

        switch (currentStep) {
          case 0:
            addAgentMessage(`I'm creating ${numAgents} diverse UXUser agents now...`);
            break;
          case 1:
            addAgentMessage(
              `All ${numAgents} agents are performing the tasks. Screen recordings are in progress...`
            );
            break;
          case 2:
            addAgentMessage(`Surveying all ${numAgents} UserAgents to gather feedback...`);
            break;
          case 3:
            addAgentMessage(
              `Here are some actionable insights:\n1. Cart flow is confusing.\n2. Layout elements hamper checkout.\n3. Error feedback is insufficient.\n\nLet me know if you'd like more details or want to tag any @UXUser directly.`
            );
            break;
          default:
            break;
        }
      }, 2000); // Matches the animation duration for smooth transition
      return () => clearTimeout(timer);
    }
  }, [studyStarted, currentStep, progressSteps.length, numAgents]);

  const addAgentMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'agent', text }]);
  };

  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!currentUserMessage.trim()) return;

    const newMsg = { sender: 'user', text: currentUserMessage };
    setMessages((prev) => [...prev, newMsg]);
    const userInput = currentUserMessage;
    setCurrentUserMessage('');

    setTimeout(() => {
      const userAgentMention = userInput.match(/@UXUser\d+/);
      if (userAgentMention) {
        addAgentMessage(
          `${userAgentMention} says: "I encountered an issue with the layout on mobile, making it hard to find the checkout button."`
        );
      } else {
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
          <VerticalStepper steps={progressSteps} currentStep={currentStep} />

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