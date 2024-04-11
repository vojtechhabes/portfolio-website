const highlights = document.querySelectorAll(".highlight");

for (const highlight of highlights) {
  window.addEventListener("scroll", () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 200;
    const elementTop = highlight.getBoundingClientRect().top;

    if (elementTop < windowHeight - elementVisible) {
      highlight.classList.add("active");
    }
  });
}
