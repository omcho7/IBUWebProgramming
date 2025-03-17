const pageCache = {};

function navigate(page) {
  if (pageCache[page]) {
    document.getElementById("content").innerHTML = pageCache[page];
    history.pushState({ page }, "", "#" + page);
  } else {
    fetch(`pages/${page}.html`)
      .then((response) => response.text())
      .then((data) => {
        pageCache[page] = data;
        document.getElementById("content").innerHTML = data;
        history.pushState({ page }, "", "#" + page);
      })
      .catch(() => {
        document.getElementById("content").innerHTML =
          "<h2>Page Not Found</h2>";
      });
  }
}

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.page) {
    navigate(event.state.page);
  }
});

const initialPage = location.hash.replace("#", "") || "home";
navigate(initialPage);
