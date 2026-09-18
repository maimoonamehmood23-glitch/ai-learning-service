const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.main-nav');

const form = document.getElementById('contactForm');
const statusMessage = document.getElementById('formStatus');

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');

    navToggle.setAttribute(
      'aria-expanded',
      String(isOpen)
    );
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');

      navToggle.setAttribute(
        'aria-expanded',
        'false'
      );
    });
  });
}


/* =========================================================
   CHAT MESSAGE FUNCTION
========================================================= */

function addChatMessage(sender, text) {
  if (!chatMessages) {
    return;
  }

  const message = document.createElement('div');

  message.className = `message ${sender}`;

  const bubble = document.createElement('span');

  bubble.textContent = text;

  message.appendChild(bubble);

  chatMessages.appendChild(message);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}


/* =========================================================
   LOADING MESSAGE
========================================================= */

function addLoadingMessage() {
  if (!chatMessages) {
    return null;
  }

  const message = document.createElement('div');

  message.className = 'message bot loading-message';

  const bubble = document.createElement('span');

  bubble.textContent = 'Thinking...';

  message.appendChild(bubble);

  chatMessages.appendChild(message);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  return message;
}


/* =========================================================
   REMOVE LOADING MESSAGE
========================================================= */

function removeLoadingMessage(message) {
  if (message && message.parentNode) {
    message.parentNode.removeChild(message);
  }
}


/* =========================================================
   TALK TO BACKEND AI MODEL
========================================================= */

async function getAIReply(userText) {

  /*
    IMPORTANT:

    This is the backend endpoint.

    Your backend should have an endpoint like:

        POST /api/chat

    and it should receive:

        {
          "message": "user question"
        }

    and return:

        {
          "reply": "AI answer"
        }
  */

  const response = await fetch('/api/chat', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      message: userText
    })
  });


  /* =======================================================
     CHECK IF SERVER RESPONDED CORRECTLY
  ======================================================= */

  if (!response.ok) {

    let errorMessage = 'The AI server returned an error.';

    try {
      const errorData = await response.json();

      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (error) {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }


  /* =======================================================
     READ BACKEND RESPONSE
  ======================================================= */

  const data = await response.json();


  /*
    Normally your backend should return:

      {
        "reply": "..."
      }

    But this also supports a few common response formats.
  */

  if (typeof data.reply === 'string') {
    return data.reply;
  }

  if (typeof data.response === 'string') {
    return data.response;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (
    data.message &&
    typeof data.message.content === 'string'
  ) {
    return data.message.content;
  }


  /*
    Ollama-style response
  */

  if (
    data.message &&
    typeof data.message.content === 'string'
  ) {
    return data.message.content;
  }

  if (typeof data.response === 'string') {
    return data.response;
  }


  throw new Error(
    'The backend returned a response, but no AI answer was found.'
  );
}


/* =========================================================
   CHAT FORM
========================================================= */

if (chatForm && chatInput && chatMessages) {

  chatForm.addEventListener('submit', async (event) => {

    event.preventDefault();


    /* -----------------------------------------------------
       GET USER MESSAGE
    ----------------------------------------------------- */

    const userText = chatInput.value.trim();


    if (!userText) {
      return;
    }


    /* -----------------------------------------------------
       SHOW USER MESSAGE
    ----------------------------------------------------- */

    addChatMessage('user', userText);


    /* -----------------------------------------------------
       CLEAR INPUT
    ----------------------------------------------------- */

    chatInput.value = '';


    /* -----------------------------------------------------
       DISABLE INPUT WHILE AI IS THINKING
    ----------------------------------------------------- */

    chatInput.disabled = true;

    const submitButton =
      chatForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
    }


    /* -----------------------------------------------------
       SHOW THINKING MESSAGE
    ----------------------------------------------------- */

    const loadingMessage = addLoadingMessage();


    try {

      /* ---------------------------------------------------
         SEND USER QUESTION TO REAL AI BACKEND
      --------------------------------------------------- */

      const reply = await getAIReply(userText);


      /* ---------------------------------------------------
         REMOVE THINKING MESSAGE
      --------------------------------------------------- */

      removeLoadingMessage(loadingMessage);


      /* ---------------------------------------------------
         SHOW REAL AI ANSWER
      --------------------------------------------------- */

      addChatMessage('bot', reply);

    } catch (error) {

      console.error('AI Chat Error:', error);


      /* ---------------------------------------------------
         REMOVE THINKING MESSAGE
      --------------------------------------------------- */

      removeLoadingMessage(loadingMessage);


      /* ---------------------------------------------------
         SHOW ERROR
      --------------------------------------------------- */

      addChatMessage(
        'bot',
        'Sorry, I could not connect to the AI model right now. Please try again.'
      );

    } finally {

      /* ---------------------------------------------------
         ENABLE INPUT AGAIN
      --------------------------------------------------- */

      chatInput.disabled = false;

      if (submitButton) {
        submitButton.disabled = false;
      }

      chatInput.focus();
    }
  });
}


/* =========================================================
   CONTACT FORM
========================================================= */

if (form) {

  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    message: document.getElementById('message')
  };


  const errors = {
    name: document.getElementById('nameError'),
    email: document.getElementById('emailError'),
    message: document.getElementById('messageError')
  };


  const setStatus = (message, type) => {

    if (!statusMessage) {
      return;
    }

    statusMessage.textContent = message;

    statusMessage.className =
      `form-status ${type}`;

    statusMessage.hidden = false;

    statusMessage.setAttribute(
      'aria-live',
      'polite'
    );
  };


  const setError = (name, message) => {

    const field = fields[name];
    const error = errors[name];


    if (field) {

      field.setAttribute(
        'aria-invalid',
        message ? 'true' : 'false'
      );

      field.style.borderColor = message
        ? 'var(--error)'
        : 'rgba(148, 163, 184, 0.6)';
    }


    if (error) {
      error.textContent = message;
    }
  };


  const validateField = (name) => {

    const field = fields[name];

    if (!field) {
      return true;
    }

    const value = field.value.trim();


    /* NAME */

    if (
      name === 'name' &&
      value.length < 2
    ) {

      setError(
        name,
        'Please enter your name.'
      );

      return false;
    }


    /* EMAIL */

    if (name === 'email') {

      const isValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(value);

      if (!isValid) {

        setError(
          name,
          'Please enter a valid email address.'
        );

        return false;
      }
    }


    /* MESSAGE */

    if (
      name === 'message' &&
      value.length < 10
    ) {

      setError(
        name,
        'Message must be at least 10 characters long.'
      );

      return false;
    }


    setError(name, '');

    return true;
  };


  /* -------------------------------------------------------
     VALIDATE WHILE TYPING
  ------------------------------------------------------- */

  Object.keys(fields).forEach((key) => {

    if (!fields[key]) {
      return;
    }

    fields[key].addEventListener(
      'input',
      () => validateField(key)
    );

  });


  /* -------------------------------------------------------
     CONTACT FORM SUBMIT
  ------------------------------------------------------- */

  form.addEventListener(
    'submit',
    (event) => {

      event.preventDefault();


      const isNameValid =
        validateField('name');

      const isEmailValid =
        validateField('email');

      const isMessageValid =
        validateField('message');


      if (
        !isNameValid ||
        !isEmailValid ||
        !isMessageValid
      ) {

        setStatus(
          'Please fix the highlighted fields and try again.',
          'error'
        );

        return;
      }


      form.reset();


      Object.keys(fields).forEach(
        (key) => setError(key, '')
      );


      setStatus(
        'Thank you! Your message has been sent successfully.',
        'success'
      );


      form.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });

    }
  );
}