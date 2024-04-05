const textAreas = document.querySelectorAll("textarea");

for (const textArea of textAreas) {
  textArea.style.height = textArea.scrollHeight + "px";
  textArea.addEventListener("input", () => {
    textArea.style.height = "auto";
    textArea.style.height = textArea.scrollHeight + "px";
  });
}
