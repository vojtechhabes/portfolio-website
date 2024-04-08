const images = document.querySelectorAll(".title-section > .image > img");
const speed = 0.4;

window.addEventListener("scroll", function () {
  images.forEach((image) => {
    const y = window.scrollY;
    image.style.transform = `translateY(${y * speed}px)`;
  });
});
