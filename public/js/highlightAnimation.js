const highlights = document.querySelectorAll(".highlight");

window.addEventListener("scroll", () => {
  for (const highlight of highlights) {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;
    const elementTop = highlight.getBoundingClientRect().top;

    if (elementTop < windowHeight - elementVisible) {
      highlight.classList.add("active");
    }
  }
});
