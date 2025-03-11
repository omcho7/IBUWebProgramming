function navigate(page) {
  fetch(`pages/${page}.html`)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("content").innerHTML = data;
      history.pushState({ page }, "", "#" + page);
    })
    .catch(
      () =>
        (document.getElementById("content").innerHTML =
          "<h2>Page Not Found</h2>")
    );
}

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.page) {
    navigate(event.state.page);
  }
});

const initialPage = location.hash.replace("#", "") || "home";
navigate(initialPage);
