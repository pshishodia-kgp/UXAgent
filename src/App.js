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
      const timer = setTimeout(async () => {
        setCurrentStep((prev) => prev + 1);
        
        switch (currentStep) {
          case 0:
            addAgentMessage(`I'm creating ${numAgents} diverse UXUser agents now...`);
            break;
          case 1:
            addAgentMessage(`All ${numAgents} agents are performing the tasks. Screen recordings are in progress...`);
            break;
          case 2:
            // Enhanced survey message with actual feedback
            addAgentMessage(
              `Surveying all ${numAgents} UserAgents to gather feedback...\n\n` +
              `Here's what they said:\n\n` +
              Object.entries(agentFeedback).map(([agent, conversation]) => 
                `${agent}: "${conversation[1].text}"`
              ).join('\n\n')
            );
            break;
          case 3:
            try {
              const feedbackSummary = Object.entries(agentFeedback)
                .map(([agent, conversation]) => 
                  `${agent}'s feedback:\n${conversation.map(msg => `${msg.role}: ${msg.text}`).join('\n')}`
                ).join('\n\n');

              const prompt = `As a UX expert, analyze this user feedback and provide key insights:\n\n${feedbackSummary}`;
              const response = await callGeminiAPI(prompt);
              addAgentMessage(response);
            } catch (error) {
              console.error('Error generating insights:', error);
              addAgentMessage('Sorry, I encountered an error while generating insights. Please try again.');
            }
            break;
          default:
            break;
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [studyStarted, currentStep, progressSteps.length, numAgents, agentFeedback]);

  // Function to add a new agent message to the chat
  const addAgentMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'agent', text }]);
  };

  // Handle user sending a message
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
          const prompt = `Context - Conversation with ${agentId}:\n${agentContext}\n\nUser question: ${userInput}\n\nProvide a detailed response as ${agentId}, maintaining consistency with the previous responses.`;
          
          const response = await callGeminiAPI(prompt);
          addAgentMessage(`${agentId} responds: ${response}`);
        }
      } else {
        const feedbackContext = Object.entries(agentFeedback)
          .map(([agent, conversation]) => 
            `${agent}'s feedback:\n${conversation.map(msg => `${msg.role}: ${msg.text}`).join('\n')}`
          ).join('\n\n');

        const prompt = `Context - User feedback from a UX study:\n${feedbackContext}\n\nUser question: ${userInput}\n\nProvide a detailed response addressing the user's question based on the feedback data.`;
        
        const response = await callGeminiAPI(prompt);
        addAgentMessage(response);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      addAgentMessage('Sorry, I encountered an error while processing your request. Please try again.');
    }
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
