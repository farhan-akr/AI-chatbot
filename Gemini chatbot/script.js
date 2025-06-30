const container = document.querySelector(".container");
const chatContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

// setting up API
const API_KEY = "AIzaSyAXPpNB2ptWsnmSjnr4BoeECNqUP63xwwk";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

let typingInterval, controller;
const chatHistory = [];
const userData = { message: "", file: {} };

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

  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent +=
        (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      document.body.classList.remove("bot-responding");
      botMsgDiv.classList.remove("loading");
    }
  }, 40);
};

// make the api call and generate bot's response
const generateresponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();
  // adding user message to chat history
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: (({ fileName, isImage, ...rest }) => rest)(
                userData.file
              ),
            },
          ]
        : []),
    ],
  });

  try {
    // send the chat history to the api to get a response
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // process the response text and display
    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .trim();
    typingEffect(responseText, textElement, botMsgDiv);
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
  } catch (error) {
    textElement.style.color = "#d62939";
    textElement.textContent =
      error.name === "AbortError"
        ? "Response Generation Stopped."
        : error.message;
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {};
  }
};

// handling form submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();

  if (!userMessage || document.body.classList.contains("bot-responding"))
    return;
  promptInput.value = "";

  userData.message = userMessage;
  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");

  // generating user message and adding in chats container
  const userMsgHTML = `<p class="message-text"></p>
  ${
    userData.file.data
      ? userData.file.isImage
        ? `<img src="data:${userData.file.mime_type};base64, ${userData.file.data}" class="img-attachmnent"/>`
        : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p> `
      : ""
  }
  `;
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

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";
    const base64String = e.target.result.split(",")[1];
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add(
      "active",
      isImage ? "img-attached" : "file-attached"
    );
    userData.file = {
      fileName: file.name,
      data: base64String,
      mime_type: file.type,
      isImage,
    };
  };
});

// cancel file button
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");
});

// stop ongoing bot response
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  userData.file = {};
  controller?.abort();
  clearInterval(typingInterval);
  chatContainer
    .querySelector(".bot-message.loading")
    .classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

// delete chats
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatContainer.innerHTML = "";
  document.body.classList.remove("bot-responding", "chats-active");
});

// handles suggestions
document.querySelectorAll(".suggestions-item").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit`"));
  });
});

document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const shouldHide =
    target.classList.contains("prompt-input") ||
    (wrapper.classList.contains("hide-controls") &&
      (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
});

// Toggle theme
themeToggle.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

// set initial theme from local storage
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

promptForm.addEventListener("submit", handleFormSubmit);
promptForm
  .querySelector("#add-file-btn")
  .addEventListener("click", () => fileInput.click());
