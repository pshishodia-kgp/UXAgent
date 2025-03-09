// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

function VerticalStepper({ steps, currentStep, stepWork }) {
  const [selectedStep, setSelectedStep] = useState(null); // State to track the clicked step

  return (
    <div className="stepper-container">
      <div className="stepper-columns">
        {/* Left Column: Step Names */}
        <div className="stepper-left-column">
          {steps.map((step, index) => (
            <div
              className={`stepper-step ${index <= currentStep ? 'active' : ''} ${
                selectedStep === index ? 'selected' : ''
              }`}
              key={index}
              onClick={() => setSelectedStep(index)} // Set the selected step on click
            >
              <div className="stepper-icon">{index + 1}</div>
              <div className="stepper-content">
                <div className="stepper-label">{step}</div>
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

        {/* Right Column: Scrollable Work Area */}
        <div className="stepper-right-column">
          {selectedStep !== null && (
            <div className="stepper-work-container">
              <h4>{steps[selectedStep]}</h4>
              <div className="stepper-work">{stepWork[selectedStep]}</div>
            </div>
          )}
        </div>
      </div>
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

  const stepWork = [
    `Creating ${numAgents} diverse UXUser agents with detailed profiles and behaviors...`,
    `All ${numAgents} agents are performing tasks, recording screens, and logging interactions...`,
    `Surveying ${numAgents} UserAgents for detailed feedback on usability and experience...`,
    'Generating actionable insights from the study, analyzing patterns and anomalies...',
    'Study completed! All data processed and insights ready for review.',
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
            addAgentMessage(`Step 1 completed. Moving to task performance...`);
            break;
          case 1:
            addAgentMessage(`Step 2 completed. Proceeding to survey agents...`);
            break;
          case 2:
            addAgentMessage(`Step 3 completed. Generating insights now...`);
            break;
          case 3:
            addAgentMessage(
              `Here are some actionable insights:\n1. Cart flow is confusing due to unclear button placement.\n2. Layout elements hamper checkout on smaller screens.\n3. Error feedback is insufficient, lacking clear guidance.\n\nLet me know if you'd like more details or want to tag any @UXUser directly.`
            );
            break;
          default:
            break;
        }
      }, 2000);
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
          <div className="chat-section">
            <div className="messages-container">
              {messages.length > 0 && (
                <div className={`message-bubble agent-bubble`}>
                  <p>{messages[0].text}</p>
                </div>
              )}
              {studyStarted && currentStep >= 0 && (
                <div className="embedded-stepper">
                  <h3>Study Progress</h3>
                  <VerticalStepper
                    steps={progressSteps}
                    currentStep={currentStep}
                    stepWork={stepWork}
                  />
                </div>
              )}
              {messages.slice(1).map((msg, idx) => (
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