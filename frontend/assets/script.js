const pageCache = {};
const pageScripts = {
 // home: "pages/home.js",
  about: "pages/about.js",
  contact: "pages/contact.js",
  login: "pages/login.js",
  signup: "pages/signup.js",
  "client/Cdashboard": "pages/client/dashboard.js",
  "client/Cform": "pages/client/Cform.js",
  "client/Cform2": "pages/client/Cform2.js",
  "admin/Adashboard": "pages/admin/Adashboard.js"
  // Add more as needed
};

// Page initializers map
const pageInitializers = {
  "client/Cdashboard": "initDashboard",
  "login": "initLogin",
  "signup": "initSignup",
  "client/Cform": "initHealthGoalsForm",
  "client/Cform2": "initAllergiesForm",
  "admin/Adashboard": "initAdminDashboard"
  
  // Add more initializers as needed
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