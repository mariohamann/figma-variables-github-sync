// // watch <html> and check if class is figma-dark. If yes, add sl-theme-dark to <body>. Do it initially as well.
// const observer = new MutationObserver(mutations => {
//   mutations.forEach(mutation => {
//     if (mutation.attributeName === "class") {
//       const html = document.documentElement;
//       const body = document.body;
//       if (html.classList.contains("figma-dark")) {
//         body.classList.add("sl-theme-dark");
//       } else {
//         body.classList.remove("sl-theme-dark");
//       }
//     }
//   });
// });

// observer.observe(document.documentElement, { attributes: true });
// if (document.documentElement.classList.contains("figma-dark")) {
//   document.body.classList.add("sl-theme-dark");
// }
