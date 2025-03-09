// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

import { ARUN_UX_AGENT_PROMPT, INSIGHT , STUDY_CRITERIA, STUDY_GOAL} from './constants';


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
  const [studyStarted, setStudyStarted] = useState(false);
  const [studyGoal, setStudyGoal] = useState(STUDY_GOAL);
  const [studyCriteria, setStudyCriteria] = useState(STUDY_CRITERIA);
  const [numAgents, setNumAgents] = useState(3);
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepWork, setStepWork] = useState([]); // Initialize as empty array
  
  // Move agentFeedback state declaration here, before the useEffect
  const [agentFeedback] = useState({
    "UXUser1": [
      { "role": "interviewer", "text": "Can you walk me through your experience navigating the TrueMeds website?" },
      { "role": "agent", "text": "Sure. I opened the website on Firefox and tried searching for 'DOLO' using the search bar. At first, it seemed straightforward, but then I faced some issues." },
      { "role": "interviewer", "text": "What issues did you encounter during the search process?" },
      { "role": "agent", "text": "Whenever I typed 'DOLO,' the search suggestions kept replacing what I typed, making it hard to select the right option. I had to be extra careful when clicking to ensure I got the correct item." },
      { "role": "interviewer", "text": "That sounds frustrating. Once you found the product, how was your experience adding it to the cart?" },
      { "role": "agent", "text": "It wasn't very smooth. I clicked 'Add to Cart,' but a 'Compare and Choose' popup appeared, showing a cheaper alternative. While I liked the suggestion, I just wanted to buy DOLO, so I ignored it and tried adding it to the cart." },
      { "role": "interviewer", "text": "Did you face any difficulties within the 'Compare and Choose' popup?" },
      { "role": "agent", "text": "Yes. The quantity selection wasn't very clear. I noticed a checkbox next to it, but it wasn't working properly. I clicked 'Add to Cart' multiple times, but nothing happened." },
      { "role": "interviewer", "text": "How did you eventually resolve the issue?" },
      { "role": "agent", "text": "I got frustrated and closed the popup. Then, I went back to the main product page and clicked 'Add to Cart' again, and this time it worked. A badge appeared on the cart icon, confirming the addition." },
      { "role": "interviewer", "text": "Once the item was in your cart, how was the experience proceeding to checkout?" },
      { "role": "agent", "text": "I clicked 'Proceed to Cart,' but then a login popup appeared, asking me to enter my phone number. That's where I faced another issue." },
      { "role": "interviewer", "text": "What issue did you face with the login popup?" },
      { "role": "agent", "text": "There was no visible way to close it. I tried clicking outside the popup, but it didn't go away. I also looked for a close ('X') button, but there wasn't one. It felt like I was stuck unless I logged in." },
      { "role": "interviewer", "text": "How did that impact your overall experience?" },
      { "role": "agent", "text": "It was frustrating. I wasn't ready to log in yet, but I had no option to exit the popup. It made me feel forced into the process rather than having control over my shopping experience." },
      { "role": "interviewer", "text": "If you could change one thing about this experience, what would it be?" },
      { "role": "agent", "text": "I'd make the cart process clearer—fix the search bar glitches, improve the add-to-cart experience, and definitely add an easy way to close the login popup." },
      { "role": "interviewer", "text": "Thank you for sharing your insights. Your feedback is really valuable." },
      { "role": "agent", "text": "You're welcome! I hope this helps improve the experience." }
    ]
  });

  // Now the useEffect can access agentFeedback
  useEffect(() => {
    const generateSummaries = async () => {
      try {
        const summaries = await Promise.all(
          Object.entries(agentFeedback).map(async ([agent, conversation]) => {
            const conversationText = conversation
              .map(msg => `${msg.role}: ${msg.text}`)
              .join('\n');
            
            const prompt = `Summarize this UX feedback conversation in 50 words or less:\n\n${conversationText}`;
            const summary = await callGeminiAPI(prompt);
            
            return `${agent}: "${summary.trim()}"`;
          })
        );

        setStepWork([
          `Creating ${numAgents} diverse UXUser agents with detailed profiles and behaviors...`,
          `All ${numAgents} agents are performing tasks, recording screens, and logging interactions...`,
          `Surveying ${numAgents} UserAgents to gather feedback...<br /><br />` +
          `Here's what they said:<br /><br />` +
          summaries.join('<br /><br />'),
          'Generating actionable insights from the study, analyzing patterns and anomalies...',
          'Study completed! All data processed and insights ready for review.',
        ]);
      } catch (error) {
        console.error('Error generating summaries:', error);
        // Fallback to showing first response if API fails
        setStepWork([
          `Creating ${numAgents} diverse UXUser agents with detailed profiles and behaviors...`,
          `All ${numAgents} agents are performing tasks, recording screens, and logging interactions...`,
          `Surveying ${numAgents} UserAgents to gather feedback...`,
          'Generating actionable insights from the study, analyzing patterns and anomalies...',
          'Study completed! All data processed and insights ready for review.',
        ]);
      }
    };

    generateSummaries();
  }, [numAgents, agentFeedback, callGeminiAPI]);

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
              // const response = await callGeminiAPI(prompt);
              const response = INSIGHT
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
            <textarea
              value={studyGoal}
              onChange={(e) => setStudyGoal(e.target.value)}
              placeholder={studyGoal}
              required
              style={{ height: 'auto' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />

            <label>People Criteria:</label>
            <textarea
              value={studyCriteria}
              onChange={(e) => setStudyCriteria(e.target.value)}
              placeholder={studyCriteria}
              required
              style={{ height: '250px' }}
              onInput={(e) => {
                e.target.style.height = '100px';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
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
                placeholder="Type your message... (mention users to ask questions to specific users @Arun etc.)"
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