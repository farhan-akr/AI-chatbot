const container = document.querySelector(".container");
const chatContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");

// setting up API
const API_KEY = "AIzaSyAXPpNB2ptWsnmSjnr4BoeECNqUP63xwwk";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

let userMessage = "";
const chatHistory = [];

// function to create message element
const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const scrollToBottom = () =>
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

// typing effect for bot response
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  const typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent +=
        (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
    }
  }, 40);
};

// make the api call and generate bot's response
const generateresponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  // adding user message to chat history
  chatHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  try {
    // send the chat history to the api to get a response
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // process the response text and display
    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .trim();
    typingEffect(responseText, textElement, botMsgDiv);
  } catch (error) {
    console.log(error);
  }
};

// handling form submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  userMessage = promptInput.value.trim();

  if (!userMessage) return;
  promptInput.value = "";

  // generating user message and adding in chats container
  const userMsgHTML = `<p class="message-text"></p>`;
  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");

  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    // generating bot message and adding in chats container in 600ms
    const botMsgHTML = `<img src="gemini-logo.svg" class="avatar"> <p class="message-text">Just a sec...</p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");

    userMsgDiv.querySelector(".message-text").textContent = userMessage;
    chatContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateresponse(botMsgDiv);
  }, 600);
};
promptForm.addEventListener("submit", handleFormSubmit);
promptForm
  .querySelector("#add-file-btn")
  .addEventListener("click", () => fileInput.click());
