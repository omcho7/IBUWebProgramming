const pageCache = {};
const pageScripts = {
  // home: "pages/home.js",
  // about: "pages/about.js",  // Removed since we don't need it
  // contact: "pages/contact.js",  // Removed since we don't need it
  login: "pages/login.js",
  signup: "pages/signup.js",
  "client/Cdashboard": "pages/client/dashboard.js",
  "client/Cform": "pages/client/Cform.js",
  "client/Cform2": "pages/client/Cform2.js",
  "admin/Adashboard": "pages/admin/Adashboard.js"
};

const pageInitializers = {
  "client/Cdashboard": "initDashboard",
  "login": "initLogin",
  "signup": "initSignup",
  "client/Cform": "initHealthGoalsForm",
  "client/Cform2": "initAllergiesForm",
  "admin/Adashboard": "initAdminDashboard"
};

// Global logout function
window.logoutUser = function() {
  localStorage.removeItem("user_token");
  localStorage.removeItem("user_data");
  navigate('home');  // Using our SPA navigation instead of direct URL
};

function navigate(page) {
  if (page.startsWith('/')) page = page.slice(1);

  if (pageCache[page]) {
    document.getElementById("content").innerHTML = pageCache[page];
    history.pushState({ page }, "", "#" + page);
    loadPageScript(page);
  } else {
    fetch(`pages/${page}.html`)
      .then((response) => {
        if (!response.ok) throw new Error('Page not found');
        return response.text();
      })
      .then((data) => {
        pageCache[page] = data;
        document.getElementById("content").innerHTML = data;
        history.pushState({ page }, "", "#" + page);
        loadPageScript(page);
      })
      .catch(() => {
        document.getElementById("content").innerHTML = "<h2>Page Not Found</h2>";
      });
  }
}

function loadPageScript(page) {
  // Remove old page script if exists
  const oldScript = document.getElementById("page-script");
  if (oldScript) oldScript.remove();

  if (pageScripts[page]) {
    const script = document.createElement("script");
    script.src = pageScripts[page];
    script.id = "page-script";
    script.type = "module";
    
    // For ES modules, we need to handle initialization differently
    if (page === "admin/Adashboard" || page === "client/Cdashboard") {
      script.onload = async function() {
        try {
          // Use proper relative path for module import
          const module = await import(`../../frontend/${pageScripts[page]}`);
          const initializerName = pageInitializers[page];
          
          // Verify token and user data before initialization
          const token = localStorage.getItem('user_token');
          const userData = localStorage.getItem('user_data');
          
          if (!token || !userData) {
            console.error('Missing authentication data');
            navigate('login');
            return;
          }
          
          if (module[initializerName]) {
            module[initializerName]();
          } else {
            console.error(`Module ${pageScripts[page]} does not export ${initializerName}`);
          }
        } catch (error) {
          console.error(`Error loading module ${pageScripts[page]}:`, error);
          // Don't clear localStorage on module load error
          if (error.message.includes('token')) {
            navigate('login');
          }
        }
      };
    } else {
      // Handle non-module scripts as before
      script.onload = function() {
        setTimeout(() => {
          const initializerName = pageInitializers[page];
          if (initializerName && typeof window[initializerName] === 'function') {
            window[initializerName]();
          } else {
            console.log(`Could not find initializer ${initializerName} for ${page}`);
          }
        }, 100);
      };
    }
    
    document.body.appendChild(script);
  }
}

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.page) {
    navigate(event.state.page);
  }
});

// Make navigate function globally available
window.navigate = navigate;

const initialPage = location.hash.replace("#", "") || "home";
navigate(initialPage);

// Add contact form handling
document.addEventListener('click', function(event) {
  if (event.target.matches('[data-action="submit-contact"]')) {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const topic = document.getElementById('topic').value;
    const message = document.getElementById('message').value;

    if (!fullName || !email || !topic || !message) {
      toastr.error('Please fill in all fields');
      return;
    }

    const data = {
      fullName: fullName,
      email: email,
      topic: topic,
      message: message
    };

    console.log('Sending data:', data);

    fetch('/OmarOsmanovic/IBUWebProgramming/backend/contact-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      console.log('Response received:', response);
      if (!response.ok) {
        return response.json().then(err => Promise.reject(err));
      }
      return response.json();
    })
    .then(result => {
      console.log('Success response:', result);
      if (result.success) {
        toastr.success('Message sent successfully! We will get back to you soon.');
        document.getElementById('contactForm').reset();
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    })
    .catch(error => {
      console.error('Error submitting contact form:', error);
      toastr.error(error.error || error.message || 'Failed to send message. Please try again.');
    });
  }
});