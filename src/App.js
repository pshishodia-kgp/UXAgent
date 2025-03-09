// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

import { ARUN_UX_AGENT_PROMPT } from './constants';


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
          {selectedStep !== null ? (
            <div className="stepper-work-container">
              <h4>{steps[selectedStep]}</h4>
              <div className="stepper-work" 
                dangerouslySetInnerHTML={{ __html: stepWork[selectedStep] }}>
              </div>
            </div>
          ) : (
            currentStep >= 0 && (
              <div className="stepper-work-container">
                <h4>{steps[currentStep]}</h4>
                <div className="stepper-work">{stepWork[currentStep]}</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Define the labels for the progress steps
const progressSteps = [
  'Creating UserAgents',
  'UserAgents performing tasks',
  'Surveying UserAgents',
  'Generating insights',
  'Done',
];

// Update the Gemini API call function
async function callGeminiAPI(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function App() {
  // Track if we've started a study yet
  const [studyStarted, setStudyStarted] = useState(false);
  const [studyGoal, setStudyGoal] = useState('');
  const [studyCriteria, setStudyCriteria] = useState('');
  const [numAgents, setNumAgents] = useState(3);
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);

  // Add dummy feedback conversations for each agent
  const [agentFeedback] = useState({
    'UXUser1': [
      { role: 'interviewer', text: "How was your experience with the medicine cart process?" },
      { role: 'agent', text: "The cart process was quite confusing. I couldn't easily find where to adjust quantities, and the 'Add to Cart' button wasn't very visible on mobile." },
      { role: 'interviewer', text: "What specific difficulties did you face?" },
      { role: 'agent', text: "The main issues were: 1) The cart icon was too small, 2) Price breakdowns weren't clear, and 3) I wasn't sure if my medicine was actually added to cart due to lack of confirmation." }
    ],
    'UXUser2': [
      { role: 'interviewer', text: "Could you walk me through your experience?" },
      { role: 'agent', text: "Sure. I found the medicine search easy, but the checkout process was frustrating. The payment options were limited for my region in Rajasthan." },
      { role: 'interviewer', text: "What would have made it better?" },
      { role: 'agent', text: "Having UPI payment options prominently displayed and supporting local payment methods would help. Also, the delivery time estimates weren't clear for my pin code." }
    ],
    'UXUser3': [
      { role: 'interviewer', text: "What was your overall impression of the cart experience?" },
      { role: 'agent', text: "The language was a barrier. Everything was in English, and I would have preferred Hindi options. Also, the prescription upload process wasn't intuitive." },
      { role: 'interviewer', text: "Any other accessibility concerns?" },
      { role: 'agent', text: "Yes, the text size was too small, and the color contrast made it hard to read prices and medicine details." }
    ]
  });

  // Add stepWork as state
  const [stepWork, setStepWork] = useState([
    `Creating ${numAgents} diverse UXUser agents with detailed profiles and behaviors...`,
    `All ${numAgents} agents are performing tasks, recording screens, and logging interactions...`,
    `Surveying all ${numAgents} UserAgents to gather feedback...<br /><br />` +
    `Here's what they said:<br /><br />` +
    Object.entries(agentFeedback).map(([agent, conversation]) => 
      `${agent}: "${conversation[1].text}"`
    ).join('<br /><br />'),
    'Generating actionable insights from the study, analyzing patterns and anomalies...',
    'Study completed! All data processed and insights ready for review.',
  ]);

  const handleStartStudy = (e) => {
    e.preventDefault();
    if (!studyGoal.trim() || !studyCriteria.trim()) return;

    setStudyStarted(true);
    setCurrentStep(0);

    const firstAgentMsg = {
      sender: 'user',
      text: `Hey, I want to run a UX study with the following specifications: \n\nStudy Goal: ${studyGoal}\n\nCriteria:${studyCriteria}\n\nNumber of agents: ${numAgents}.\n`,
    };
    setMessages([firstAgentMsg]);
  };

  //   TODO(pshishodia): May not be needed since the work is already shown on the right side. 
  useEffect(() => {
    if (studyStarted && currentStep >= 0 && currentStep < progressSteps.length - 1) {
      const timer = setTimeout(async () => {
        setCurrentStep((prev) => prev + 1);
        
        switch (currentStep) {
          case 0:
            break;
          case 1:
            break;
          case 2:
            break;
          case 3:
            try {
              const feedbackSummary = Object.entries(agentFeedback)
                .map(([agent, conversation]) => 
                  `${agent}'s feedback:\n${conversation.map(msg => `${msg.role}: ${msg.text}`).join('\n')}`
                ).join('\n\n');

              const prompt = `As a UX expert, analyze this user feedback and provide key insights in 100 words:\n\n${feedbackSummary}`;
              const response = await callGeminiAPI(prompt);
              // Update stepWork using setState
              setStepWork(prev => {
                const newStepWork = [...prev];
                newStepWork[3] = response.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return newStepWork;
              });
            } catch (error) {
              console.error('Error generating insights:', error);
              setStepWork(prev => {
                const newStepWork = [...prev];
                newStepWork[3] = 'Sorry, I encountered an error while generating insights. Please try again.';
                return newStepWork;
              });
            }
            break;
          default:
            break;
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [studyStarted, currentStep, progressSteps.length, numAgents, agentFeedback]);

  const addAgentMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'agent', text }]);
  };

  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUserMessage.trim()) return;

    const newMsg = { sender: 'user', text: currentUserMessage };
    setMessages((prev) => [...prev, newMsg]);
    const userInput = currentUserMessage;
    setCurrentUserMessage('');

    try {
      const userAgentMention = userInput.match(/@(UXUser[123])/);
      if (userAgentMention) {
        const agentId = userAgentMention[1];
        const feedback = agentFeedback[agentId];
        if (feedback) {
          const agentContext = feedback.map(msg => `${msg.role}: ${msg.text}`).join('\n');
          const prompt = `Context - Conversation with ${agentId}:\n${agentContext}\n\nUser question: ${userInput}\n\nProvide a brief response as ${agentId} within 75 words, maintaining consistency with the previous responses.`;
          
          const response = await callGeminiAPI(prompt);
          addAgentMessage(`**${agentId}:**\n${response}`);
        }
      } else {
        const feedbackContext = Object.entries(agentFeedback)
          .map(([agent, conversation]) => 
            `${agent}'s feedback:\n${conversation.map(msg => `${msg.role}: ${msg.text}`).join('\n')}`
          ).join('\n\n');

        const prompt = `Context - User feedback from a UX study:\n${feedbackContext}\n\nUser question: ${userInput}\n\nProvide a brief response addressing the user's question based on the feedback data within 75 words.`;
        
        const response = await callGeminiAPI(prompt);
        addAgentMessage(`**UX agent:**\n${response}`);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      addAgentMessage('Sorry, I encountered an error while processing your request. Please try again.');
    }
  };

  return (
    <div className="app-wrapper">
      <div className="header-bar">
        <h1>InsightsBot</h1>
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
                <div className={`message-bubble ${messages[0].sender === 'user' ? 'user-bubble' : 'agent-bubble'}`}>
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
                  <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
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